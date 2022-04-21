import { Duration, RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
//import { Role } from 'aws-cdk-lib/aws-iam';

import path = require('path');
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Cors, LambdaIntegration, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';

export class CdkAwsLambdaPrismaLayerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //DB INSTANCE

    // 1 create the VPC
    const vpc = new ec2.Vpc(this, 'my-tutorial-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // 2 create a security group for the the DB
    const dbSG = new ec2.SecurityGroup(this, 'sec-group-tutorial', {
      vpc,
    });
    dbSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic(), 'allow connections from anywhere from everything');
    // 3 create the postgres instance
    const engine = rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_13_4 });

    const instance = new rds.DatabaseInstance(this, 'InstanceWithUsernameAndPassword', {
      engine,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      multiAz: false,
      credentials: rds.Credentials.fromPassword('root', SecretValue.plainText('password123')),
      databaseName: 'test_db',
      publiclyAccessible: true,
      removalPolicy: RemovalPolicy.DESTROY,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
    });
    instance.connections.allowDefaultPortFromAnyIpv4(); // ? is this necessary ?

    const PRISMA_DATABASE_URL =
      'postgresql://root:password123@ci1npusx98vs431.cdc2agrb8okz.eu-south-1.rds.amazonaws.com:5432/test_db?schema=public&connection_limit=3';

    //layer prisma

    const tutorial_prisma_layer = new LayerVersion(this, 'tutorial_prisma_layer', {
      compatibleRuntimes: [Runtime.NODEJS_14_X],
      removalPolicy: RemovalPolicy.DESTROY,
      code: Code.fromAsset(path.join(__dirname, '/../layers/tutorial_prisma_layer.zip')),
    });

    //function lambda
    const tutorial_test_lambda_function = new NodejsFunction(this, 'tutorial_test_lambda', {
      runtime: Runtime.NODEJS_14_X,
      entry: `${__dirname}/../lambdas/tutorial_test_lambda.ts`,
      handler: 'handler',
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: {
        DATABASE_URL: PRISMA_DATABASE_URL,
      },
      bundling: {
        minify: true,
        externalModules: ['@prisma/client', 'prisma'],
      },
      layers: [tutorial_prisma_layer],
    });

    //api gateway
    const tutorialRestApi = new LambdaRestApi(this, 'tutorial_prisma_restAPI', {
      restApiName: 'Tutorial Rest API',
      handler: tutorial_test_lambda_function,
      proxy: false,
      deployOptions: {
        stageName: 'dev',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    //lambda integration

    const tutorial_lambda_integration = new LambdaIntegration(tutorial_test_lambda_function, {});
    const tutorial_lambda_resource = tutorialRestApi.root.addResource('testlambda', {
      defaultIntegration: tutorial_lambda_integration,
    });

    tutorial_lambda_resource.addMethod('GET', tutorial_lambda_integration);
  }
}

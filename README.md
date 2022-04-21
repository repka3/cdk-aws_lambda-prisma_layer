# CDK + AWS Lambda + Prisma Layer

This project is for reference for creating Prisma (https://www.prisma.io/) layer for AWS Lambda since I cannot find it anywhere.
The tutorial I found was based on linux + bundle everything Prisma related (well not everything) with the AWS Lambda.
This is not a real world example when you tipically have more then one AWS Lambda need to query the database with Prisma.

I used python3 as "bundle script" for creating the Prisma layer since you can use it on win, linux or mac.

My best accomplish is ~14Mb for the layer (Down from 230+Mb). If you find more to remove, send PR !

Following this project you will have 2 different clients and "installations" for Prisma.

One from the root directory where you have the full Prisma library to managing stuff like Migrations in different stages (prod,staging, develop, etc)

Then you have the layer installation with the bare minimum for using query inside the AWS lambdas.


Feel free to contribute as you like.

Video link in English:

Video link in Italian:



## Steps

- `npm run build`   install everything from the main directory.
- `tsc`             "compile" typescript

### create a DB manually in AWS or Whatever or use the Stack with cdk (comment out every line after steps 3 for a moment in cdk stack so you just create the db before the whole stack is created

Once you have a DB infos fill the URL for example in .env.develop (if you have special character in password or user name must be URL encoded) https://www.prisma.io/docs/reference/database-reference/connection-urls and you can use for example https://www.url-encode-decode.com/ for encoding

- `npm run prisma:generate:develop` (generating the "main" prisma client with env for develop (check package.json)
- `npm run prisma:generate:migrate --name init` (if you want use migration)

Bundle the layer with:

- `python .\layers\create_prisma_layer_from_generate.py`   (bundle the layer and strip the Prisma client to minimum)
- `cdk synth --profile default`     (check if CDK feels ok)
- `cdk deploy --profile default`    GO !




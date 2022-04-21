'use strict';

import { APIGatewayProxyEvent } from 'aws-lambda';
import Tutorial_Test_Manager from './common_manager/tutorial_test_entity_manager';
import { createPrismaClient } from '/opt/nodejs/tutorial_prisma_layer';

function return200_withbody(obj_body: any) {
  return {
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,POST,PUT,PATCH,DELETE',
    },
    statusCode: 200,
    body: JSON.stringify(obj_body),
  };
}
function returnClient_witherrorAndHttpStatusCode(statusCode: number, client_message: string, backend_message: string) {
  console.error(backend_message);
  return {
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,POST,PUT,PATCH,DELETE',
    },
    statusCode: statusCode,
    body: JSON.stringify({ client_message: client_message }),
  };
}

const prisma_client = createPrismaClient();

exports.handler = async (event: APIGatewayProxyEvent) => {
  console.info(event);
  try {
    const manager = new Tutorial_Test_Manager(prisma_client);
    const items = await manager.getAll();
    return return200_withbody(items);
  } catch (error) {
    return returnClient_witherrorAndHttpStatusCode(500, 'General Error :(((', JSON.stringify(error));
  }
};

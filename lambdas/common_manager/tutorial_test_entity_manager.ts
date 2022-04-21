import { PrismaClient } from '/opt/nodejs/tutorial_prisma_layer';

class Tutorial_Test_Entity_Manager {
  prismac: PrismaClient;
  constructor(prismac: PrismaClient) {
    this.prismac = prismac;
  }

  async getAll(): Promise<any> {
    let items = await this.prismac.test_entity.findMany();
    return items;
  }
}

export default Tutorial_Test_Entity_Manager;

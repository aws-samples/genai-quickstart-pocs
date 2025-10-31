import { getDeployedResourceArn, getLambdaEnvironmentVariables } from "../utils";
import { executeSQLQueryTool } from '../../amplify/functions/productionAgentFunction/toolBox';
import outputs from '@/../amplify_outputs.json';

async function main() {
    const rootStackName = outputs.custom.root_stack_name
    const sampleAthenaDataSource = await getDeployedResourceArn(rootStackName, `PostgresAthenaDataSource`)
    console.log('sampleAthenaDataSource: ', sampleAthenaDataSource)

    await getLambdaEnvironmentVariables(await getDeployedResourceArn(rootStackName, 'productionagentfunctionlambda'))

    // console.log('ATHENA_WORKGROUP_NAME: ', process.env.ATHENA_WORKGROUP_NAME)

    const tableDefinitions = await executeSQLQueryTool.invoke({
        query: /* sql */ ` 
            SELECT 
            oil ,
            gas , 
            water,
            proddate
            FROM "${sampleAthenaDataSource}".production.daily
            WHERE proddate >= date_add('week', -12, current_date)`,


        // query: /* sql */ `
        //     SHOW TABLES FROM AwsDataCatalog.prod_db_e1d;
        // `,

        // query: /* sql */ `
        //     SELECT schema_name 
        //     FROM information_schema.schemata;
        // `,
        // database: "public",
        // columnNameFromQueryForXAxis: 'proddate',
        // chartTitle: "test chart"
    });
    console.log('result:\n', tableDefinitions);
}

main()
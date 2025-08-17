import { getDeployedResourceArn, getLambdaEnvironmentVariables } from "../utils";
import { getTableDefinitionsTool } from '../../amplify/functions/productionAgentFunction/toolBox';
import outputs from '@/../amplify_outputs.json';

async function main() {
    const rootStackName = outputs.custom.root_stack_name
    await getLambdaEnvironmentVariables(await getDeployedResourceArn(rootStackName, 'productionagentfunctionlambda'))

    const tableDefinitions = await getTableDefinitionsTool.invoke({ tableFeatures: "Average Oil Production Over the Last 10 weeks" });
    console.log('tableDefinitions:\n', tableDefinitions);
}

main()
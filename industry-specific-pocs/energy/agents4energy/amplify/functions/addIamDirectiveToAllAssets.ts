import {
    AppSyncClient,
    ListGraphqlApisCommand,
    ListTagsForResourceCommand,
    GetIntrospectionSchemaCommand,
    StartSchemaCreationCommand,
    GetSchemaCreationStatusCommand
} from "@aws-sdk/client-appsync";

import { Context } from 'aws-lambda';
import { parse, print, visit, ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode } from "graphql";
// import { env } from '$amplify/env/dummy-function';

const appSyncClient = new AppSyncClient();

async function getAppSyncApiIdByTag(): Promise<string | null> {
    if (!process.env.ROOT_STACK_NAME) throw new Error("Root Stack Name not in env")

    const appSyncClient = new AppSyncClient();
    let nextToken: string | undefined;

    try {
        do {
            const listApisResponse = await appSyncClient.send(
                new ListGraphqlApisCommand({ nextToken })
            );

            for (const api of listApisResponse.graphqlApis || []) {
                if (api.arn) {
                    const tagsResponse = await appSyncClient.send(
                        new ListTagsForResourceCommand({ resourceArn: api.arn })
                    );

                    if (
                        tagsResponse.tags &&
                        'rootStackName' in tagsResponse.tags &&
                        tagsResponse.tags['rootStackName'] === process.env.ROOT_STACK_NAME &&
                        api.apiId) {
                        return api.apiId
                    }
                }
            }

            nextToken = listApisResponse.nextToken;
        } while (nextToken);

        console.log("No AppSync API found with the specified tag.");
        return null;
    } catch (error) {
        console.error("Error fetching AppSync API:", error);
        return null;
    }
}

function addDirectivesToSchema(props: { schema: string, directivesToAdd: string[] }): string {
    const ast = parse(props.schema);


    const modifiedAst = visit(ast, {
        ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
            //Add the @aws_iam directive to the node
            const updatedNodeDirectives: DirectiveNode[] = []
            // console.log('field: ', node.name.value)
            // console.log('directives: ', node.directives)
            props.directivesToAdd.forEach((directive: string) => {

                if (!node.directives?.some(d => d.name.value === directive)) {
                    updatedNodeDirectives.push({
                        kind: 'Directive',
                        name: { kind: 'Name', value: directive },
                    })
                }
            })

            //Also add the directive to all fields
            return {
                ...node,
                directives: [...(node.directives || []), ...updatedNodeDirectives],
                fields: node.fields?.map((field: FieldDefinitionNode) => {
                    const existingFieldDirectives = field.directives || [];
                    const updatedFieldDirectives: DirectiveNode[] = []

                    props.directivesToAdd.forEach((directive: string) => {
                        if (!field.directives?.some(d => d.name.value === directive)) {
                            updatedFieldDirectives.push({
                                kind: 'Directive',
                                name: { kind: 'Name', value: directive },
                            })
                        }
                    })

                    return {
                        ...field,
                        directives: [
                            ...existingFieldDirectives,
                            ...updatedFieldDirectives
                        ],
                    };
                }),
            };
        },
    });

    return print(modifiedAst);
}

async function updateAppSyncSchema(apiId: string, newSchema: string) {
    // const client = new AppSyncClient(); // Replace with your AWS region

    try {
        // Start schema creation
        const startSchemaCreationCommand = new StartSchemaCreationCommand({
            apiId: apiId,
            definition: Buffer.from(newSchema),
        });
        await appSyncClient.send(startSchemaCreationCommand);

        // Check schema creation status
        let schemaCreationComplete = false;
        while (!schemaCreationComplete) {
            const getSchemaCreationStatusCommand = new GetSchemaCreationStatusCommand({
                apiId: apiId,
            });
            const statusResponse = await appSyncClient.send(getSchemaCreationStatusCommand);

            if (statusResponse.status === "SUCCESS") {
                schemaCreationComplete = true;
                console.log("Schema update completed successfully.");
            } else if (statusResponse.status === "FAILED") {
                throw new Error(`Schema update failed: ${statusResponse.details}`);
            } else {
                // Wait for 5 seconds before checking again
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    } catch (error) {
        console.error("Error updating AppSync schema:", error);
        throw error;
    }
}

export const handler = async (event: any, context: Context, callback: any): Promise<any> => {

    // let responseData = {};
    // let responseStatus: "SUCCESS" | "FAILED" = 'SUCCESS';
    // let responseReason = ''

    // const apiId = event.apiId; // Assume the API ID is passed in the event
    // const apiId = getApiIdFromEndpoint(env.AMPLIFY_DATA_GRAPHQL_ENDPOINT)
    // const apiId = event.ResourceProperties.apiId;

    // const apiId = await getAppSyncApiIdByTag()
    const apiId = process.env.APPSYNC_API_ID

    if (!apiId) throw new Error("API ID not found");

    const directivesToAdd = ['aws_iam','aws_cognito_user_pools']

    if (!apiId) throw new Error("API ID not found");

    // Get the current schema
    const getSchemaCommand = new GetIntrospectionSchemaCommand({ // GetIntrospectionSchemaRequest
        apiId: apiId, // required
        format: "SDL", // required
        includeDirectives: true,
    });
    const schemaResponse = await appSyncClient.send(getSchemaCommand);
    const currentSchema = new TextDecoder('utf-8').decode(schemaResponse.schema);

    // const currentSchema = `
    // type Query @aws_cognito_user_pools @aws_iam {
    // getUser(id: ID!): User @aws_cognito_user_pools
    // }

    // type User {
    // id: ID!
    // name: String!
    // email: String!
    // }

    // type Post {
    // id: ID!
    // title: String!
    // content: String!
    // author: User!
    // }

    // input UpdateChatSessionInput {
    // aiBotInfo: ChatSessionAiBotInfoInput
    // firstMessageSummary: String
    // id: ID!
    // }

    // `

    if (!currentSchema) {
        throw new Error("Failed to retrieve schema");
    }


    // console.log('currentSchema: ', currentSchema)

    // Modify the AST
    const modifiedSchema = addDirectivesToSchema({
        schema: currentSchema,
        directivesToAdd: directivesToAdd
    })

    console.log('new schema:\n', modifiedSchema)

    await updateAppSyncSchema(apiId, modifiedSchema)
    return {
        statusCode: 200,
        body: "Successfully Updated Schema"
    }

};
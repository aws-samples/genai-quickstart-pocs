import { Stack } from 'aws-cdk-lib';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnAccessPolicy, CfnCollection, CfnSecurityPolicy } from 'aws-cdk-lib/aws-opensearchserverless';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface OpenSearchVectorCollectionProps {
  collectionName: string;
  description?: string;
  indexName: string;
  taskRoleArn?: string;
}

export class OpenSearchServerlessVectorCollection extends Construct {
  public readonly collection: CfnCollection;
  public readonly ossIAMPolicy: PolicyStatement;

  constructor(scope: Construct, id: string, props: OpenSearchVectorCollectionProps) {
    super(scope, id);

    // Create the collection
    this.collection = new CfnCollection(this, 'Collection', {
      name: props.collectionName,
      description: props.description || `Vector Search Collection for ${props.collectionName}`,
      type: 'VECTORSEARCH',
    });

    this.ossIAMPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'aoss:APIAccessAll', // Allows API access to the collection
      ],
      resources: [
        `arn:aws:aoss:${Stack.of(this).region}:${Stack.of(this).account}:collection/${props.collectionName}`,
      ],
    });

    // Index mapping matching the specified vector fields
    const vectorIndexMapping = {
      mappings: {
        properties: {
          vectors: {
            type: 'knn_vector',
            dimension: 1536,
            method: {
              name: 'hnsw',
              engine: 'nmslib',
              space_type: 'euclidean',
              parameters: {
                ef_construction: 512,
                ef_search: 512,
                m: 16,
              },
            },
          },
        },
      },
    };

    // Create network policy
    const networkPolicy = new CfnSecurityPolicy(this, 'NetworkPolicy', {
      name: 'network-policy',
      type: 'network',
      description: 'Network policy for vector search collection',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${props.collectionName}`],
            },
          ],
          AllowFromPublic: true,
        },
      ]),
    });

    // Create encryption policy
    const encryptionPolicy = new CfnSecurityPolicy(this, 'EncryptionPolicy', {
      name: 'encryption-policy',
      type: 'encryption',
      description: 'Encryption policy for vector search collection',
      policy: JSON.stringify(
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${props.collectionName}`],
            },
          ],
          AWSOwnedKey: true,
        },
      ),
    });
    if (props.taskRoleArn) {
      const dataAccessPolicy = new CfnAccessPolicy(this, 'DataAccessPolicy', {
        name: 'access-policy',
        type: 'data',
        description: 'Data access policy for vector search collection',
        policy: JSON.stringify(
          {
            Rules: [
              {
                ResourceType: 'index',
                Resource: [`index/${props.collectionName}/*`],
                Permission: [
                  'aoss:CreateIndex',
                  'aoss:DeleteIndex',
                  'aoss:UpdateIndex',
                  'aoss:DescribeIndex',
                  'aoss:ReadDocument',
                  'aoss:WriteDocument',
                  'aoss:KnnSearch',
                ],
              },
            ],
            Principal: [
              props.taskRoleArn,
            ],
          },
        ),
      });
      this.collection.node.addDependency(dataAccessPolicy);

    }
    // Create data access policy with vector search specific permissions

    // Create a role for the custom resource
    const customResourceRole = new Role(this, 'IndexCreationRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        IndexCreationPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'aoss:CreateIndex',
                'aoss:DeleteIndex',
                'aoss:UpdateIndex',
                'aoss:DescribeIndex',
              ],
              resources: [`arn:aws:aoss:${Stack.of(this).region}:${Stack.of(this).account}:collection/${props.collectionName}`],
            }),
          ],
        }),
      },
    });

    // Custom resource to create the index with vector search mappings
    new AwsCustomResource(this, 'IndexCreation', {
      onCreate: {
        service: 'OpenSearchServerless',
        action: 'createIndex',
        parameters: {
          collectionName: props.collectionName,
          id: props.indexName,
          mappings: vectorIndexMapping,
        },
        physicalResourceId: PhysicalResourceId.of(`${props.collectionName}-${props.indexName}-index`),
      },
      onDelete: {
        service: 'OpenSearchServerless',
        action: 'deleteIndex',
        parameters: {
          collectionName: props.collectionName,
          id: props.indexName,
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      installLatestAwsSdk: true,
      role: customResourceRole,
    });

    // Add dependencies
    this.collection.node.addDependency(networkPolicy);
    this.collection.node.addDependency(encryptionPolicy);
  }
}
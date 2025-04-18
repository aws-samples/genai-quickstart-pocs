# Working Memory Tool

The Working Memory component is for sharing state across a set of collaborating agents. The supervisor defines a unique named workspace that can be thought of as a table. Each agent uses Working Memory to save and look up key value pairs in that workspace as needed. For example, a Market Analyst agent can save its research to a ‘market_research’ key, while the Chief Strategist can retrieve that research as input to coming up with its ‘market_strategy’. In an investment research collaboration, a Fundamentals Expert and an Economics Expert can independently share there assessments of a given investment opportunity, while a Portfolio Manager could retrieve an entire set of assessments and apply its overall judgement to produce a final rating. Working Memory is a utility that can be added to agents and is currently implemented as a simple Lambda function wrapper on top of DynamoDB.

![architecture](./architecture.png)

## Deploy [working_memory_stack.yaml](/src/shared/working_memory/cfn_stacks/working_memory_stack.yaml)

|   Region   | development.yaml |
| ---------- | ----------------- |
| us-east-1  | [![launch-stack](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=WorkingMemory&templateURL=https://ws-assets-prod-iad-r-iad-ed304a55c2ca1aee.s3.us-east-1.amazonaws.com/1031afa5-be84-4a6a-9886-4e19ce67b9c2/tools/working_memory_stack.yaml)|
| us-west-2  | [![launch-stack](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/new?stackName=WorkingMemory&templateURL=https://ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com/1031afa5-be84-4a6a-9886-4e19ce67b9c2/tools/working_memory_stack.yaml)|

## Usage

For a detailed example checkout [startup_advisor_agent](/examples/multi_agent_collaboration/startup_advisor_agent/)

## Clean Up

- Open the CloudFormation console.
- Select the stack `WorkingMemory` you created, then click **Delete**. Wait for the stack to be deleted.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.


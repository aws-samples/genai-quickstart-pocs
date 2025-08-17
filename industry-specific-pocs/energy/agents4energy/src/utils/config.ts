// import { BedrockAgent } from "@aws-sdk/client-bedrock-agent"
import outputs from '@/../amplify_outputs.json';

type BaseAgent = {
    name: string
    samplePrompts: string[]
    source: 'bedrockAgent' | 'graphql'
}

export type BedrockAgent = BaseAgent & {
    source: "bedrockAgent"
    agentId: string
    agentAliasId: string
}

export type LangGraphAgent = BaseAgent & {
    source: "graphql"
    invokeFieldName: string
}

export const defaultAgents: { [key: string]: BaseAgent | BedrockAgent | LangGraphAgent } = {
    PlanAndExecuteAgent: {
        name: `Production Agent`,
        source: `graphql`,
        samplePrompts: [
            `This morning well with API number 30-045-29202 stopped producing gas with indication of a hole in tubing.  
            Make a table of all operational events found in the well files. 
            Query all historic monthly production rates and make a plot with both the event and production data. 
            Estimate the value of the well's remaining production. 
            Write a procedure to repair the well, estimate the cost of the repair, and calculate financial metrics. 
            Make an executive report about repairing the well with detailed cost and procedure data. 
            Use the ai role for all steps.
            `.replace(/^\s+/gm, ''),
            `Search the well files for the well with API number 30-045-29202 to make a table with type of operation (drilling, completion, workover, plugging, other), text from the report describing operational details, and document title.
            Also execute a sql query to get the total monthly oil, gas and water production from this well.
            Create a plot with both the event data and the production data. `.replace(/^\s+/gm, ''), //This trims the white space at the start of each line
            `Plot the total monthly oil, gas, and water production since 1900 for the well with API number 30-045-29202`,
            `Which form of artifical lift best matches my personality?`
        ]
    },
    MaintenanceAgent: {
        name: "Maintenance Agent",
        source: "bedrockAgent",
        agentId: outputs.custom.maintenanceAgentId,
        agentAliasId: outputs.custom.maintenanceAgentAliasId,
        samplePrompts: [
            "How many tanks are in my biodiesel unit?",
            "In September 2024, what are a few key incidents and actions taken at the biodiesel unit?",
        ],
    } as BedrockAgent,
    RegulatoryAgent: {
        name: "Regulatory Agent",
        source: "bedrockAgent",
        agentId: outputs.custom.regulatoryAgentId,
        agentAliasId: outputs.custom.regulatoryAgentAliasId,
        samplePrompts: [
            "What are the requirements for fugitive emissions monitoring and reporting in the U.S.?",
            "What are the requirements for decomissioning an offshore oil well in Brazil?",
        ],
    } as BedrockAgent,
    PetrophysicsAgent: {
        name: "Petrophysics Agent",
        source: "bedrockAgent",
        agentId: outputs.custom.petrophysicsAgentId,
        agentAliasId: outputs.custom.petrophysicsAgentAliasId,
        samplePrompts: [
            "Give me a summary fluid substitution modeling",
            "Give me the inputs of Gassmann equation",
            "What are AVO classes?",
            "Calculate the intercept and gradient value of the wet sandstone with vp=3.5 km/s, vs=1.95 km/s, bulk density=2.23 gm/cc when it is overlain by a shale? Determine the AVO class.",
            "A wet sandstone has vp=3.5 km/s, vs=1.95 km/s, bulk density=2.23 gm/cc. What are the expected seismic velocities of the sandstone if the desired ﬂuid saturation is 80% oil? Use standard assumptions."
            ],
    } as BedrockAgent
}
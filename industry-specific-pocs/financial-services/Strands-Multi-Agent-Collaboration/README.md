# Principles for building Multi-Agents

## Use Case Qualification
### Principle #1: Do not force-fit workloads  into a collaboration pattern.
Identify business decision frictions and then design workflows around the proper pattern.

### Principle #2: Desing for enterprise productivity (not just individual task augmentation)
Use Agentic systems when decision and automation with adaptability are needed
(Exploring different trajectories for the solution)

## Patterns Development
### Principle #3: Acknowledge tradeoffs with agency, control, and reliability
𝗔𝗴𝗲𝗻𝗰𝘆 (autonomy): Independent decision-making
𝗖𝗼𝗻𝘁𝗿𝗼𝗹 (predictability): Constraining agent behavior
𝗥𝗲𝗹𝗶𝗮𝗯𝗶𝗹𝗶𝘁𝘆 (consistency): Consistent results across executions
High-agency agents are those where an agent’s actions are primarily self-governed, constrained only by its environment, and a goal.
Agency and control are a tradeoff, which means the more free the agent is to take actions, the less can users control its behaviour. But also agency and reliability is also a tradeoff. Allowing an agent to take long horizon decisions bounded only by the availability of tools is a recipe for unreliable behaviour. 
High-agency agents achieve only 20-30% reliability on complex tasks. But constrained, step-based agents hit 60%+ reliability—the enterprise sweet spot.


### Principle #4: Share Context
For effective interaction, provide the full context and complete history of agent interactions, rather than isolating individual messages. 

### Principle #5: Recognize Action-Decision Relationships
Every action reflects an underlying decision. When multiple actions stem from contradictory decisions, negative outcomes are likely to occur. Avoid semantic ambiguity and conflicting actions




In this folder we will provide Jupyter Notebook examples on how to get started with different Strands Agents functionalities.

## FSI Use Cases
### Multi-Agent architecture for Autonomous Claims Adjudication
Problem we are going to solve:

From an user perspective: Delayed Payments (where is my money)
From a Insurance firm perspective:
Need clear states, dependencies among tasks.
Administrative Burden
Staff Shortages
Inconsistencies
Lack of collaboration
Manual process and errors

End state when we complete the architecture:  
Reasoning paradigm: Chain of thought with Sequential Pattern with clear dependencies, states.

Applied Principle: 1, 2, 3


### Multi-Agent architecture for Automated Financial Research and Analysis

Problem we are going to solve: 
Data limitations: Availability, multimodal data type: text, images, video, voice. 
Interpretation of data
High Costs and time consuming
Model/Solution limitation: Flexibility

In the financial services industry, analysts need to switch between structured data (such as time-series pricing information), unstructured text (such as SEC filings and analyst reports), and audio/visual content (earnings calls and presentations). Each format requires different analytical approaches and specialized tools, creating workflow inefficiencies. Add on top of this the intense time pressure resulting from rapidly evolving industry conditions and narrow decision windows. Delayed analysis can mean missed opportunities or failure to identify emerging risks, with potentially significant financial consequences.


Final State of Architecture: 
Hierarchical MAS system, showing a SWARM of agent collaborating to collect, process, analyze data from different sources.

Reasoning Paradigm: Collaborative reasoning, information sharing and emergent intelligence 

Applied Principle: 1, 2, 3, 4

### Multi-Agent architecture for Intelligent Loan Application processing
Problem we are going to solve:
Assess risk and determine a borrower’s credit worthiness. 

Documentation processing and application inconsistencies
Fast and accurate Financial Analysis
Credit evaluation
Discrepancies
Income validation
Fraud/Misrepresentation

Final State of Architecture: 
Hierarchical MAS system, showing layered tasks distribution and definitions flow of data sharing.

Reasoning Paradigm: layered processing and  task delegation.

Applied Principle: 1, 2, 3, 4, 5



                                                           |

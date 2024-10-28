# POC Usage Guide

This guide covers how to use the Streamlit POC in the browser. 
For information guidance on downloading and running the POC, please visit the [README](README.md)
---


## Question & Answer (Q&A)
The Question & Answer (Q&A) model evaluation prep builds a prompt that includes the question and possible answer choices. For the Q&A workflow, you will be asked to map the following CSV columns. You will need to map the following columns:
* Question ID - The unique ID for each question. 
* Question - The quetion text
* Answer - The answer value to the question
* Is Correct - If the answer in is correct or incorrect
* Category - The question category (Optional)

At this time, data mapping for Q&A requires each answer to have a row. Answers are grouped by Question by using the question ID. 

## Text Summarization
The text summarization model evaluation prep builds a prompt that includes the CSV columns you select and is instructed to summarize the provided content. 

Additionally, you will need to map the Expected Answer, which is what you expect the Bedrock Model to respond with as a summary. This is used to evaluate the quality of output compared to your expectations. Category can also be mapped, but is not required. 

## Classification
The classification model evaluation prep builds a prompt that includes the CSV columns you select and is instructed to respond with a classification category from a list of provided categories. 

Additionally, you will need to map the Expected Answer, which is what you expect the Bedrock Model to respond with as a classification category. 
You will be prompted to provide a comma seperated list of classification categories that you'd like to the model to use when determining what classification category should assigned as the response. Category can also be mapped, but is not required, and doesn't impact the classification category determination.


## Text Generation
The text generation model evalution prep builds a prompt that includes the CSV columns you select and is instructed to generate text using the provided text.

Additionally, you will need to map the Expected Answer, which is what you expect the Bedrock Model to respond with as Generated Text. Category can also be mapped, but is not required. 
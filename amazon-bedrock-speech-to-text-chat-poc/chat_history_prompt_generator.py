# creating an empty array to store the question and answer dictionaries
question_history = []


def chat_history(session_state):
    """
    This function takes the current session state, including the user question and the LLM response, parses it, and formats
    it into a prompt. It preserves the session state up to 4 questions/answers and then removes the oldest question/answer.
    It writes the formatted questions and answers to the chat_history.txt file so that it can be easily injected to the
    final prompt in the model_invoker.py file.
    :param session_state: The session state that is passed in from the front end that contains each individual user question
    and LLM answer.
    """
    # initializing an empty question string
    question = ""
    # initializing an empty answer string
    answer = ""
    # initializing an empty dictionary to store the specific question and related answer
    question_answer = dict()
    # looping through the session state dictionary, and gathering the question and answer and storing it in a dictionary
    for message in session_state.get('messages'):
        # if the message is from a user, it is a question
        if message.get('role') == 'user':
            # storing each user message in the question variable
            question = message.get('content')
        # if the message is from a assistant, it is an answer
        if message.get('role') == 'assistant':
            # storing each assistant message in the answer variable
            answer = message.get('content')
        # storing the formatted answer and question in a dictionary for each individual question/answer pair
        question_answer = {
            "question": question,
            "answer": answer
        }
    # adding each question_answer dictionary to a list
    question_history.append(question_answer)
    # simple logic to ensure that the chat history is only kept for the most recent 4 questions/answers
    if len(question_history) > 4:
        # removing the oldest question/answer when the question_history list is larger than 4
        question_history.remove(question_history[0])
    else:
        pass
    # initiating the final prompt string, where each question answer will be formatted and stored
    final_prompt = ""
    # looping through the list containing each question/answer pair
    for question_answer_pair in question_history:
        # formatting the prompt, with question and answer from previous asks
        final_prompt += f"""
        
        Question: {question_answer_pair.get('question')}
        
        Answer: {question_answer_pair.get('answer')}"""
    # opening a text file, and writing the contents of the final prompt string to it, so it can be used in other files
    with open('chat_history.txt', 'w') as history:
        # writing the contents of the formatted questions and answers from previous questions/answers to the txt file
        history.write(final_prompt)

import streamlit as st
import asyncio
from loguru import logger
from technical_image_generation.models import ImageRequest
from technical_image_generation.storage import DynamoDBStorage
from technical_image_generation.generator import ImageGenerator
from technical_image_generation.classifier import ImageClassifier
from technical_image_generation.parameter_extractor import ParameterExtractor

async def main():
    st.title("Technical Image Generator")
    storage = DynamoDBStorage()
    generator = ImageGenerator()
    classifier = ImageClassifier(storage)
    extractor = ParameterExtractor()
    
    if 'stage' not in st.session_state:
        st.session_state.stage = 'input'
        st.session_state.template = None
        st.session_state.parameters = None
        st.session_state.missing_params = None
        st.session_state.description = None
        st.session_state.function_id = None
        st.session_state.current_image = None
        st.session_state.current_image_type = None
    
    if st.session_state.stage == 'input':
        prompt = st.text_area(
            "Describe the image you need",
            placeholder="Example: Generate a parabola showing the relationship between time and height for a projectile launched at 45 degrees",
            key="image_prompt"
        )
        st.session_state.prompt = prompt
        
        if st.button("Generate", key="generate_button"):
            with st.spinner("Analyzing request..."):
                template = await classifier.classify_request(prompt)
                parameters, missing_params = await extractor.extract_parameters(prompt, template)
                parameter_values = await extractor.map_parameter_values(prompt, template, parameters)
                description = await extractor.generate_description(prompt, template, missing_params)
                
                st.session_state.template = template
                st.session_state.parameters = parameters
                st.session_state.parameter_values = parameter_values
                st.session_state.missing_params = missing_params
                st.session_state.description = description
                st.session_state.stage = 'review'
                st.rerun()
    
    elif st.session_state.stage == 'review':
        st.write("Your request:", st.session_state.prompt)
        st.info(st.session_state.description)
        
        if st.session_state.missing_params:
            st.subheader("Missing Parameters")
            params = {}
            logger.debug(f"Missing params: {st.session_state.missing_params}")
            for param_name, param_info in st.session_state.missing_params.items():
                logger.debug(param_name, param_info)
                if param_info["type"] == "number":
                    params[param_name] = st.number_input(
                        param_name,
                        key=f"param_num_{param_name}"
                    )
                elif param_info["type"] == "boolean":
                    params[param_name] = st.checkbox(
                        param_name,
                        key=f"param_bool_{param_name}"
                    )
                else:
                    params[param_name] = st.text_input(
                        param_name,
                        key=f"param_str_{param_name}"
                    )
            
            
            if st.button("Generate with Parameters"):
                all_params = {**st.session_state.parameters, **params}
                request = ImageRequest(prompt=st.session_state.prompt, parameters=all_params)
                st.session_state.function_id = generator._get_function_id(request, st.session_state.template)
                image_data, image_type = generator.generate_image(request, st.session_state.template, st.session_state.parameter_values)
                st.session_state.current_image = image_data
                st.session_state.current_image_type = image_type
                st.image(f"data:{image_type};base64,{image_data}")
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Improve This"):
                        st.session_state.stage = 'improve'
                        st.rerun()
                with col2:
                    if st.button("Try Again"):
                        st.session_state.stage = 'input'
                        st.rerun()
        else:
            request = ImageRequest(prompt=st.session_state.prompt, parameters=st.session_state.parameters)
            st.session_state.function_id = generator._get_function_id(request, st.session_state.template)
            image_data, image_type = generator.generate_image(request, st.session_state.template, st.session_state.parameter_values)
            st.session_state.current_image = image_data
            st.session_state.current_image_type = image_type
            logger.debug(f"Image type = {image_type}")
            st.image(f"data:{image_type};base64,{image_data}")
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("Improve This"):
                    st.session_state.stage = 'improve'
                    st.rerun()
            with col2:
                if st.button("Start Over"):
                    st.session_state.clear()
                    st.session_state.stage = 'input'
                    st.rerun()

    elif st.session_state.stage == 'improve':
        st.image(f"data:{st.session_state.current_image_type};base64,{st.session_state.current_image}")
        
        feedback = st.text_area(
            "How would you like to improve this image?",
            placeholder="Example: Make the lines thicker and add grid lines",
            key="improvement_feedback"
        )
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Apply Improvements"):
                with st.spinner("Improving image..."):
                    function_data = storage.get_function(st.session_state.function_id)
                    improved_code = generator.improve_image(
                        st.session_state.function_id,
                        function_data['code'],
                        feedback
                    )
                    
                    storage.store_function(st.session_state.function_id, improved_code, {
                        'template_id': st.session_state.template.id,
                        'prompt': st.session_state.prompt,
                        'parameters': st.session_state.template.parameters,
                        'feedback': feedback
                    })
                    
                    request = ImageRequest(
                        prompt=st.session_state.prompt,
                        parameters=st.session_state.parameters
                    )
                    image_data, image_type = generator.generate_image(request, st.session_state.template, st.session_state.parameter_values)
                    st.session_state.current_image = image_data
                    st.session_state.current_image_type = image_type
                    st.rerun()
        
        with col2:
            if st.button("Start Over"):
                st.session_state.stage = 'input'
                st.rerun()

if __name__ == "__main__":
    asyncio.run(main())
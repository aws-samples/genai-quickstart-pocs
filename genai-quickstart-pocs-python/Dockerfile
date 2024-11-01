FROM python:3.12-slim

ARG POC_PATH

RUN useradd --user-group --system --no-log-init pocuser

WORKDIR /app

COPY ${POC_PATH} .

RUN pip install -r requirements.txt

RUN chown -R pocuser:pocuser /app

USER pocuser

EXPOSE 8501

ENTRYPOINT [ "streamlit" , "run", "app.py", "--server.port=8501"]
FROM python:3.13

COPY requirements.txt .
RUN pip install -r requirements.txt
WORKDIR /app
EXPOSE 8000
COPY oc-mcp.py .
CMD ["python", "oc-mcp.py", "sse"]

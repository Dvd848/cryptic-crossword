FROM python:3.11

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "doc2json.py", "-i", "/docs", "-o", "/crosswords"]

# docker build -t doc2json-app .
# docker run --volume ${PWD}:/app --volume ${PWD}\..\..\crosswords:/crosswords --volume ${PWD}\..\..\tmp\docs:/docs --rm doc2json-app
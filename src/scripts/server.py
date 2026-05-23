from contextlib import asynccontextmanager
import os
import tempfile

from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
import uvicorn
import whisper

from insteon import InsteonAgent

DIST_DIR = "/dist"
SSL_CERT = "/cert.pem"
SSL_KEY = "/key.pem"

model = whisper.load_model("small.en")
agent = InsteonAgent(os.getenv("OLLAMA_HOST", ""), os.getenv("MCP_HOST", ""), "gemma4")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await agent.__aenter__()
    try:
        yield
    finally:
        await agent.__aexit__(None, None, None)


app = FastAPI(lifespan=lifespan)


@app.post("/execute")
async def execute(audio: UploadFile = File(...)):
    prompt = await transcribe_audio(audio)
    tool_calls = await agent.execute(prompt) or []
    return {"prompt": prompt, "tool_calls": tool_calls}


async def transcribe_audio(audio: UploadFile) -> str:
    with tempfile.NamedTemporaryFile(delete=False,
                                     suffix=".webm") as temp_audio:
        contents = await audio.read()
        temp_audio.write(contents)
        temp_path = temp_audio.name

    try:
        result = model.transcribe(temp_path)
        return result["text"].strip()
    finally:
        os.remove(temp_path)


def main():
    app.mount("/",
              StaticFiles(directory=str(DIST_DIR), html=True),
              name="static")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=443,
        ssl_keyfile=str(SSL_KEY),
        ssl_certfile=str(SSL_CERT),
    )


if __name__ == "__main__":
    main()

from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
import uvicorn

DIST_DIR = "/dist"
SSL_CERT = "/cert.pem"
SSL_KEY = "/key.pem"

app = FastAPI()


@app.post("/execute")
async def execute(audio: UploadFile = File(...)):
    print(f"Received audio file: {audio.filename}, size: {audio.size} bytes")

    return {
        "transcript": "This is a mock transcript. Audio received!",
        "tool_calls": []
    }


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

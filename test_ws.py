import asyncio
import websockets
import json

async def test():
    try:
        async with websockets.connect('wss://esctrix.onrender.com/ws/test1234') as ws:
            print("Connected!")
            await ws.send(json.dumps({
                "type": "auth",
                "data": {
                    "pin": "1111",
                    "username": "test",
                    "host_username": "Testing"
                }
            }))
            res = await ws.recv()
            print("Response:", res)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())

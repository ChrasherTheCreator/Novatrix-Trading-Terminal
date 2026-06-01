import asyncio
import websockets

async def test():
    uri = "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade"
    try:
        async with websockets.connect(uri) as ws:
            print("Connected!")
            while True:
                msg = await ws.recv()
                print("Received:", msg)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())

import requests
import datetime

url = "https://api.babypips.com/economic-calendar/v1/events?timezone=Europe/Berlin&week=2024-03-04" 
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
print(resp.status_code)
print(resp.text[:500])

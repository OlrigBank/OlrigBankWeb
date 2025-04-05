# whats_on/scraper.py

import json
from datetime import datetime

def scrape_events():
    """
    Pretend to scrape events and return a list of dicts.
    Replace this with real web scraping later.
    """
    print("Scraping events...")

    # Placeholder for real scraping logic
    events = [
        {
            "title": "Farmers Market",
            "date": datetime.today().strftime("%Y-%m-%d"),
            "location": "Kendal Town Centre",
            "link": "https://example.com/events/farmers-market"
        },
        {
            "title": "Open Mic Night",
            "date": datetime.today().strftime("%Y-%m-%d"),
            "location": "Brewery Arts Centre",
            "link": "https://example.com/events/open-mic"
        }
    ]

    return events

def save_events_to_json(events, path="whats_on/events.json"):
    """
    Save a list of events to a JSON file.
    """
    with open(path, "w") as f:
        json.dump(events, f, indent=2)
    print(f"Saved {len(events)} events to {path}")

if __name__ == "__main__":
    # When run directly (e.g., from a CRON job), scrape and save events
    events = scrape_events()
    save_events_to_json(events)

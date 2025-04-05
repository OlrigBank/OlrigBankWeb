import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

def fetch_events(url):
    """
    Fetches and parses events from the given URL.

    Args:
        url (str): The URL of the events page.

    Returns:
        list: A list of dictionaries containing event details.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; YourBot/1.0; +https://olrig-bank.com/bot)'
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise an exception for HTTP errors

    soup = BeautifulSoup(response.text, 'html.parser')
    events = []

    # Locate the event listings; update the selector based on the actual HTML structure
    event_items = soup.find_all('div', class_='event-item')  # Example selector

    for item in event_items:
        title_tag = item.find('h2')
        date_tag = item.find('time')
        link_tag = item.find('a', href=True)

        title = title_tag.get_text(strip=True) if title_tag else 'No title'
        date_str = date_tag.get('datetime') if date_tag else None
        link = link_tag['href'] if link_tag else '#'

        # Convert date to a standard format if available
        if date_str:
            try:
                date = datetime.fromisoformat(date_str).strftime('%Y-%m-%d')
            except ValueError:
                date = 'Invalid date'
        else:
            date = 'No date'

        events.append({
            'title': title,
            'date': date,
            'link': link
        })

    return events

def save_events_to_json(events, filename='events.json'):
    """
    Saves the list of events to a JSON file.

    Args:
        events (list): The list of event dictionaries.
        filename (str): The filename to save the events.
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=4)

def main():
    url = 'https://visit-kendal.co.uk/events-festivals/whats-on/'
    events = fetch_events(url)
    save_events_to_json(events)
    print(f'Successfully saved {len(events)} events to events.json')

if __name__ == '__main__':
    main()

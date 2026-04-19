import json
import os

DB_PATH = r"d:\CRM\CRM\data\db.json"

# IDs of properties to keep
KEEP_PROPERTY_IDS = [
    "901c075d-4731-4bfb-992d-fc64d6c900e6", # Lodha Woods
    "ea4d54d0-0667-4b5d-bb1c-ca81e85966a6", # Prestige Falcon City
    "e2b96330-3305-4b2f-9dd5-070bed43962f", # Godrej Woods
    "prop-001"                             # Skyline Residency
]

def prune_db():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Original sizes:")
    print(f"  propertyManagement: {len(data.get('propertyManagement', []))}")
    print(f"  towers: {len(data.get('towers', []))}")
    print(f"  units: {len(data.get('units', []))}")
    print(f"  leads: {len(data.get('leads', []))}")

    # 1. Filter Property Management
    data['propertyManagement'] = [p for p in data.get('propertyManagement', []) if p['id'] in KEEP_PROPERTY_IDS]
    
    # Update Simple Properties array to match
    data['properties'] = [{"id": p['id'], "name": p['name'], "location": p['location'].get('city', '')} for p in data['propertyManagement']]

    # 2. Identify and Filter Towers
    data['towers'] = [t for t in data.get('towers', []) if t.get('propertyId') in KEEP_PROPERTY_IDS]
    keep_tower_ids = {t['id'] for t in data['towers']}

    # 3. Identify and Filter Units
    # Note: some units might be nested in towers, but we should also check the top level array
    data['units'] = [u for u in data.get('units', []) if u.get('propertyId') in KEEP_PROPERTY_IDS]
    keep_unit_ids = {u['id'] for u in data['units']}

    # 4. Filter Unit Reservations
    data['unitReservations'] = [r for r in data.get('unitReservations', []) if r.get('unitId') in keep_unit_ids]

    # 5. Filter Property Documents
    data['propertyDocuments'] = [d for d in data.get('propertyDocuments', []) if d.get('propertyId') in KEEP_PROPERTY_IDS]

    # 6. Filter Leads and associated data
    # We keep leads that are interested in the kept properties
    valid_leads = [l for l in data.get('leads', []) if l.get('propertyId') in KEEP_PROPERTY_IDS]
    keep_lead_ids = {l['id'] for l in valid_leads}
    data['leads'] = valid_leads

    # Filter bookings
    data['bookings'] = [b for b in data.get('bookings', []) if b.get('propertyId') in KEEP_PROPERTY_IDS]

    # Filter activity logs related to leads
    data['activities'] = [a for a in data.get('activities', []) if a.get('leadId') in keep_lead_ids]
    data['timeline'] = [t_item for t_item in data.get('timeline', []) if t_item.get('leadId') in keep_lead_ids]
    data['callLogs'] = [c for c in data.get('callLogs', []) if c.get('leadId') in keep_lead_ids]

    print(f"\nPruned sizes:")
    print(f"  propertyManagement: {len(data.get('propertyManagement', []))}")
    print(f"  towers: {len(data.get('towers', []))}")
    print(f"  units: {len(data.get('units', []))}")
    print(f"  leads: {len(data.get('leads', []))}")

    # 7. Add High Quality Unsplash Images
    # Using specific ones for the selected properties
    images = {
        "901c075d-4731-4bfb-992d-fc64d6c900e6": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000", # Modern Apartment
        "ea4d54d0-0667-4b5d-bb1c-ca81e85966a6": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000", # Luxury House
        "e2b96330-3305-4b2f-9dd5-070bed43962f": "https://images.unsplash.com/photo-1448630360428-65ff2ede00c2?auto=format&fit=crop&q=80&w=1000", # Forest View
        "prop-001": "https://images.unsplash.com/photo-1460317442991-0ec239397118?auto=format&fit=crop&q=80&w=1000" # Skyline
    }

    for p in data['propertyManagement']:
        if p['id'] in images:
            p['primaryImageUrl'] = images[p['id']]

    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print("\nDatabase pruned and updated successfully.")

if __name__ == "__main__":
    prune_db()

# SafeRoute - MongoDB Document Database (Project 2)

## Overview
SafeRoute is a campus safety navigation system that helps university students, staff, and visitors find the safest walking routes across campus. This project adapts the relational database from Project 1 into a MongoDB document database using the embedded data model pattern.

## Gen AI Disclosure Statement
Gen AI tools were used in the development of this project. AI was used to assist with writing the MongoDB queries and designing the hierarchical data model. All database design decisions, collection choices, and project structure were determined by me.

Model: Anthropic Claude (Opus 4.6)

## Repository Contents

| File / Folder | Description |
|---|---|
| `README.md` | This file, project overview, setup instructions, and query documentation |
| `requirements.pdf` | Problem requirements document |
| `UML_Class_Diagram.png` | Conceptual model (UML class diagram) from Project 1 |
| `ERD.png` | Entity-Relationship Diagram from Project 1 |
| `hierarchical_model.png` | Adapted hierarchical logical data model for MongoDB |
| `collections_definition.json` | JSON definitions of all collections with comments |
| `data/users.txt` | Mock data for the `users` collection (10 documents) |
| `data/zones.txt` | Mock data for the `zones` collection (5 documents) |
| `data/routes.txt` | Mock data for the `routes` collection (10 documents) |
| `queries/queries.js` | Five MongoDB queries (aggregation, complex search, count, update, filter) |

## Database Architecture

### Collections

The 9 normalized SQL tables have been consolidated into 3 MongoDB collections:

1. **users** - User profiles with embedded alert subscriptions (embeds AlertSubscription, 0..* per user)
2. **zones** - Campus zones with embedded street segments, incidents, and safety scores (Zone embeds StreetSegment 0..*, which embeds Incident 0..* and SafetyScore 0..*)
3. **routes** - Route requests with embedded generated route details and route segments (embeds GeneratedRoute 1..1, and RouteSegment 0..*)

### Design Rationale

Following the MongoDB embedded data model (denormalization), related data is aggregated into single documents to eliminate expensive JOIN operations, retrieve all related data in a single read, and match the application's natural access patterns. For example, viewing a zone loads all its streets and incidents in one query.

## Database Initialization Instructions

### Prerequisites
- MongoDB 6.0+ installed and running
- `mongoimport` CLI tool available (included with MongoDB)

### Option A: Using mongoimport (Command Line)

```bash
# 1. Start MongoDB (if not already running)
mongod --dbpath /path/to/your/db

# 2. Import each collection
mongoimport --db saferoute --collection users --file data/users.txt --jsonArray --drop
mongoimport --db saferoute --collection zones --file data/zones.txt --jsonArray --drop
mongoimport --db saferoute --collection routes --file data/routes.txt --jsonArray --drop

# 3. Verify the import
mongosh --eval "
  use saferoute;
  print('Users: ' + db.users.countDocuments());
  print('Zones: ' + db.zones.countDocuments());
  print('Routes: ' + db.routes.countDocuments());
"
```

Expected output:
```
Users: 10
Zones: 5
Routes: 10
```

### Option B: Using MongoDB Compass (GUI)

1. Open MongoDB Compass and connect to `localhost:27017`
2. Create a new database named `saferoute`
3. For each collection (`users`, `zones`, `routes`):
   - Click "Create Collection" and name it
   - Click "Add Data" then "Import JSON or CSV file"
   - Select the corresponding file from the `data/` folder
   - Confirm the import

## Queries

All queries are located in `queries/queries.js`. Open `mongosh`, run `use saferoute`, then paste each query.

### Query 1: Aggregation Framework - Average Safety Score Per Zone
**Purpose:** Calculates the average safety score for each campus zone and sorts them from least safe to most safe. This helps campus safety administrators identify which zones need the most attention. Uses `$unwind` to flatten the nested street_segments and safety_scores arrays, `$group` to compute averages, and `$sort` to rank zones.

### Query 2: Complex Search Criterion - High Priority Incidents
**Purpose:** Finds all zones that have either a verified incident with severity 4 or higher, or an unverified user-submitted incident. This uses the `$or` logical connector with `$elemMatch` for nested array matching, satisfying the requirement for a complex search with multiple expressions and logical connectors.

### Query 3: Count Documents for a Specific User
**Purpose:** Counts how many route requests user_id 1 (Alice Johnson) has made. This is useful for usage analytics and tracking how often individual users rely on the routing system.

### Query 4: Update Document Based on Query Parameter
**Purpose:** Flips the status of incident_id 5 from "Unverified" to "Verified", simulating an admin verifying a user-reported incident. Uses `arrayFilters` to target a specific element within a deeply nested array (zones > street_segments > incidents).

### Query 5: Filtered Find with Sort - Safest Routes Analysis
**Purpose:** Retrieves all routes that use the "Safest" mode and have an estimated travel time greater than 10 minutes, sorted by distance in descending order. This helps analyze whether choosing the safest route leads to significantly longer walks.

### Running the Queries

```bash
# Open the Mongo Shell
mongosh

# Switch to the database
use saferoute

# Then paste queries from queries/queries.js one at a time
```

// ============================================================================
// SafeRoute MongoDB Queries
// Database: saferoute
// ============================================================================
// To run these queries, open the Mongo Shell (mongosh) and execute:
//   use saferoute
// Then paste each query individually.
// ============================================================================


// ---------------------------------------------------------------------------
// QUERY 1: Aggregation Framework
// Purpose: Calculate the average safety score per zone, sorted from least
//          safe to most safe. Uses $unwind to flatten embedded arrays and
//          $group to compute the averages.
// ---------------------------------------------------------------------------

db.zones.aggregate([
  // Flatten street_segments array
  { $unwind: "$street_segments" },
  // Flatten safety_scores within each segment
  { $unwind: "$street_segments.safety_scores" },
  // Group by zone and compute the average score
  {
    $group: {
      _id: "$zone_name",
      avg_safety_score: { $avg: "$street_segments.safety_scores.score_value" },
      total_scores: { $sum: 1 }
    }
  },
  // Sort by average score ascending (least safe first)
  { $sort: { avg_safety_score: 1 } },
  // Format output
  {
    $project: {
      _id: 0,
      zone_name: "$_id",
      avg_safety_score: { $round: ["$avg_safety_score", 1] },
      total_scores: 1
    }
  }
]);


// ---------------------------------------------------------------------------
// QUERY 2: Complex Search Criterion (multiple logical connectors)
// Purpose: Find all zones that have at least one street segment with a
//          verified incident of severity >= 4, OR an unverified incident
//          that was user-submitted. This helps safety admins prioritize
//          which zones need attention.
// ---------------------------------------------------------------------------

db.zones.find({
  $or: [
    {
      "street_segments.incidents": {
        $elemMatch: {
          status: "Verified",
          severity: { $gte: 4 }
        }
      }
    },
    {
      "street_segments.incidents": {
        $elemMatch: {
          status: "Unverified",
          source: "User"
        }
      }
    }
  ]
},
{
  zone_name: 1,
  campus_area: 1,
  "street_segments.street_name": 1,
  "street_segments.incidents.incident_type": 1,
  "street_segments.incidents.severity": 1,
  "street_segments.incidents.status": 1
}).pretty();


// ---------------------------------------------------------------------------
// QUERY 3: Count Documents for a Specific User
// Purpose: Count how many route requests user_id 1 (Alice Johnson) has made.
//          This is useful for analytics dashboards and usage tracking.
// ---------------------------------------------------------------------------

db.routes.countDocuments({ user_id: 1 });

// For more detail, you can also see a breakdown by mode:
db.routes.aggregate([
  { $match: { user_id: 1 } },
  {
    $group: {
      _id: "$mode",
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      mode: "$_id",
      count: 1
    }
  }
]);


// ---------------------------------------------------------------------------
// QUERY 4: Update a Document Based on a Query Parameter
// Purpose: Flip the status of an unverified incident to "Verified" for a
//          specific incident on a specific street segment. This simulates
//          an admin verifying a user-reported incident.
//          Uses arrayFilters to target a specific nested array element.
// ---------------------------------------------------------------------------

// First, verify the current status:
db.zones.findOne(
  { "street_segments.incidents.incident_id": 5 },
  { "street_segments.$": 1, zone_name: 1 }
);

// Update incident_id 5 from "Unverified" to "Verified"
db.zones.updateOne(
  { "street_segments.incidents.incident_id": 5 },
  {
    $set: {
      "street_segments.$[seg].incidents.$[inc].status": "Verified"
    }
  },
  {
    arrayFilters: [
      { "seg.incidents.incident_id": 5 },
      { "inc.incident_id": 5 }
    ]
  }
);

// Verify the update took effect:
db.zones.findOne(
  { "street_segments.incidents.incident_id": 5 },
  { "street_segments.$": 1, zone_name: 1 }
);


// ---------------------------------------------------------------------------
// QUERY 5: Find and Display Routes with Detailed Filtering
// Purpose: Find all routes that use the "Safest" mode and have an estimated
//          travel time greater than 10 minutes, sorted by distance.
//          This helps analyze whether "Safest" routes tend to be longer.
// ---------------------------------------------------------------------------

db.routes.find(
  {
    mode: "Safest",
    "generated_route.estimated_minutes": { $gt: 10 }
  },
  {
    route_id: 1,
    user_id: 1,
    origin_label: 1,
    destination_label: 1,
    "generated_route.total_distance_meters": 1,
    "generated_route.estimated_minutes": 1,
    _id: 0
  }
).sort({ "generated_route.total_distance_meters": -1 }).pretty();

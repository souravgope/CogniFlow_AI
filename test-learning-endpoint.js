#!/usr/bin/env node
/**
 * Test the Learning Path endpoint
 * Usage: node test-learning-endpoint.js
 */

const BASE_URL = "https://cogniflow-ai-w56q.onrender.com";

async function testEndpoint() {
  console.log("🧪 Testing Learning Path Endpoint...\n");
  
  // Test 1: Health check
  console.log("1️⃣ Testing health endpoint...");
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (healthRes.ok) {
      console.log("✅ Health endpoint OK\n");
    } else {
      console.log("❌ Health endpoint failed\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Cannot connect to backend.\n");
    process.exit(1);
  }

  // Test 2: Learning path endpoint
  console.log("2️⃣ Testing /generate-learning-path endpoint...");
  try {
    const testData = {
      skillLevel: "Beginner",
      targetRole: "Frontend Developer",
      duration: "3 months",
      currentSkills: "HTML, CSS, JavaScript basics",
      preferences: "React"
    };

    const response = await fetch(`${BASE_URL}/generate-learning-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Endpoint returned 200 OK");
      console.log("\n📊 Response structure:");
      console.log("   - Provider:", data.provider);
      console.log("   - Warning:", data.warning || "None");
      console.log("   - Roadmap length:", data.roadmap?.length || 0);
      console.log("   - Daily Plan length:", data.dailyPlan?.length || 0);
      console.log("   - Practice length:", data.practice?.length || 0);
      console.log("   - Projects length:", data.projects?.length || 0);
      console.log("   - Progress Tracking length:", data.progressTracking?.length || 0);
      
      if (data.roadmap && data.dailyPlan && data.practice && data.projects && data.progressTracking) {
        console.log("\n✅ All expected fields present!");
        console.log("\n📖 Sample Roadmap (first 150 chars):");
        console.log("   " + data.roadmap.substring(0, 150).replace(/\n/g, "\n   "));
      } else {
        console.log("\n❌ Missing expected fields");
        process.exit(1);
      }
    } else {
      console.log(`❌ Endpoint returned ${response.status}`);
      console.log("Response:", data);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  console.log("\n✅ All tests passed!");
}

testEndpoint();

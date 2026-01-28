#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log("🔍 MongoDB Connection Test");
console.log("===========================\n");
console.log("MongoDB URI:", MONGO_URI);

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB successfully!\n");
    
    const db = mongoose.connection;
    const adminDb = db.getClient().db("admin");
    
    // Get server info
    const serverInfo = await adminDb.admin().serverInfo();
    console.log("Server Version:", serverInfo.version);
    
    // List all databases
    const databases = await adminDb.admin().listDatabases();
    console.log("\n📊 Available Databases:");
    databases.databases.forEach(db => {
      console.log(`  - ${db.name}`);
    });
    
    // Get current database info
    const currentDb = mongoose.connection.name || "test";
    console.log(`\n📁 Current Database: ${currentDb}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📋 Collections:");
    if (collections.length === 0) {
      console.log("  (No collections yet)");
    } else {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    // Test write
    console.log("\n🧪 Testing Write Operation...");
    const TestSchema = new mongoose.Schema({ 
      test: String, 
      timestamp: { type: Date, default: Date.now } 
    });
    const TestModel = mongoose.model("TestWrite", TestSchema);
    
    const testDoc = await TestModel.create({ test: "Connection successful" });
    console.log("✅ Successfully wrote test document:", testDoc._id);
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log("✅ Test document cleaned up\n");
    
    console.log("✅ All tests passed! MongoDB is working correctly.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    console.error("\nTroubleshooting steps:");
    console.error("1. Ensure MongoDB is running (check mongod/MongoDB Compass)");
    console.error("2. Verify MONGO_URI format: mongodb://[host]:[port]/[database]");
    console.error("3. Check network connectivity if using remote MongoDB");
    console.error("4. Verify credentials if using authentication");
    process.exit(1);
  });

import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/meetclone"
const MONGODB_DB = process.env.MONGODB_DB || "meetclone"

// Connection cache
let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  // If we have the connection cached, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // If no connection exists, create a new one
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI)
    await cachedClient.connect()
  }

  // Get the database
  const db = cachedClient.db(MONGODB_DB)
  cachedDb = db

  return { client: cachedClient, db }
}

import mongoose from "mongoose";
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log("MongoDB connected!");
    } catch (error) {
        console.log("DB connection failed\n" + error);
        process.exit(1); //terminate the program    
    }
}

export default connectMongoDB;
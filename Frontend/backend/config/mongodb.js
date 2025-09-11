import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('DB Connected successfully');
        });
        await mongoose.connect(`${process.env.MONGODB_URI}/ecolense`);
    } catch (error) {
        console.error('DB connection failed:', error);
    }
}
export default connectDB;

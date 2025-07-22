import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true // Adding index for improved query performance
        },
        type: {
            type: String,
            required: true,
            enum: ["follow", "like", "comment"],
            index: true // Adding index for improved query performance
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null,
            // validate: {
            //     validator: function(value) {
            //         if (this.type === "like" || this.type === "comment") {
            //             return value != null;
            //         }
            //         return true;
            //     },
            //     message: "Post field is required for 'like' and 'comment' notifications."
            // }
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
            // validate: {
            //     validator: function(value) {
            //         if (this.type === "comment") {
            //             return value != null;
            //         }
            //         return true;
            //     },
            //     message: "Comment field is required for 'comment' notifications."
            // }
        },
    },
    {
        timestamps: true
    }
);
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

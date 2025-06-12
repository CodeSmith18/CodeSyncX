import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: String,
  githubId: {
    type: String,
    unique: true,
    sparse: true, 
  },
  username: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);

export default User;

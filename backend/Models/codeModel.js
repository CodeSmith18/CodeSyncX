import mongoose from 'mongoose';

const codeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    code: {
      type: String,
    },
    input: {
      type: String,
    },
    output: {
      type: String,
    },
    selectedLanguage : {
          type : String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
  },
  {
    timestamps: true, // ✅ adds createdAt and updatedAt automatically
  }
);

const Code = mongoose.model('code', codeSchema);

export default Code;

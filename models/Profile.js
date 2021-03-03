const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  avatar: {
    type: String,
  },
  buddies: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'user',
  },
  peoplenote: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      fullName: {
        type: String,
      },
      status: {
        type: String,
      },
      avatar: {
        type: String,
      },
      remark: {
        type: String,
      },
    },
  ],
  requests: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'user',
  },
  invites: [
    {
      invite: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
      },
      projectname: {
        type: String,
      },
    },
  ],
  // projects: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: 'project',
  // },
  projects: [
    {
      project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
      },
      projectname: {
        type: String,
      },
    },
  ],
  location: {
    type: String,
  },
  founder: {
    type: String,
  },
  founder: {
    type: [String],
  },
  founded: {
    type: Date,
  },
  status: {
    type: String,
  },
  bio: {
    type: String,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
  },
  hometown: {
    type: String,
  },
  languageknown: {
    type: String,
  },
  skills: [
    {
      skill: {
        type: [String],
      },
    },
  ],
  experience: [
    {
      title: {
        type: String,
        required: true,
      },
      company: {
        type: String,
        required: true,
      },
      location: {
        type: String,
      },
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    },
  ],
  education: [
    {
      school: {
        type: String,
        required: true,
      },
      degree: {
        type: String,
        required: true,
      },
      fieldofstudy: {
        type: String,
        required: true,
      },
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    },
  ],
  awards: [
    {
      award: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      description: {
        type: String,
      },
    },
  ],
  events: [
    {
      event: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      description: {
        type: String,
      },
    },
  ],
  partners: [
    {
      partner: {
        type: [String],
      },
    },
  ],
  clients: [
    {
      client: {
        type: [String],
      },
    },
  ],
  contactus: [
    {
      email: {
        type: [String],
      },
      address: {
        type: [String],
      },
    },
  ],

  teammembers: [
    {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
      },
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    },
  ],
  awards: [
    {
      award: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      description: {
        type: String,
      },
    },
  ],
  testinomials: [
    {
      name: {
        type: String,
      },
      description: {
        type: String,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('profile', ProfileSchema);

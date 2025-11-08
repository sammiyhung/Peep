export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio?: string;
  imageId: string;
  imageUrl: string;
  file?: File[];
  username?: string;
  currentMood?: string;
  aboutMe?: string;
  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  location?: string;
  website?: string;
  phone?: string;
  // Professional Information
  occupation?: string;
  company?: string;
  skills?: string;
  interests?: string;
  // Privacy Settings
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  showDateOfBirth?: boolean;
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
  circleId?: string;
  mood?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
  aboutMe?: string;
  currentMood?: string;
  isEmailVerified?: boolean;
  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  location?: string;
  website?: string;
  phone?: string;
  // Professional Information
  occupation?: string;
  company?: string;
  skills?: string;
  interests?: string;
  // Privacy Settings
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  showDateOfBirth?: boolean;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

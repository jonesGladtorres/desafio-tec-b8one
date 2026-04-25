export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

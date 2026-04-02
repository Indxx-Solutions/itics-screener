export interface User {
  idToken: {
    jwtToken: string;
    payload: {
      profile: string;
      name: string;
      email: string;
    };
  };
  accessToken: {
    jwtToken: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isQA: boolean;
  isAnalyst: boolean;
}
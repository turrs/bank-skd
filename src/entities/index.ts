import { apiClient } from "@/lib/services/supabaseClient";

// Export entities using the new custom client
export const Payment = {
  list: () => apiClient.list('payments'),
  get: (id: string) => apiClient.get('payments', id),
  create: (data: any) => apiClient.insert('payments', data),
  update: (id: string, data: any) => apiClient.update('payments', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('payments', { column: 'id', value: id })
};

export const PaymentSetting = {
  list: () => apiClient.list('payment_settings'),
  get: (id: string) => apiClient.get('payment_settings', id),
  create: (data: any) => apiClient.insert('payment_settings', data),
  update: (id: string, data: any) => apiClient.update('payment_settings', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('payment_settings', { column: 'id', value: id })
};

export const Question = {
  list: () => apiClient.list('questions'),
  get: (id: string) => apiClient.get('questions', id),
  create: (data: any) => apiClient.insert('questions', data),
  update: (id: string, data: any) => apiClient.update('questions', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('questions', { column: 'id', value: id })
};

export const QuestionPackage = {
  list: () => apiClient.list('question_packages'),
  get: (id: string) => apiClient.get('question_packages', id),
  create: (data: any) => apiClient.insert('question_packages', data),
  update: (id: string, data: any) => apiClient.update('question_packages', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('question_packages', { column: 'id', value: id })
};

export const QuestionTagStats = {
  list: () => apiClient.list('question_tag_stats'),
  get: (id: string) => apiClient.get('question_tag_stats', id),
  create: (data: any) => apiClient.insert('question_tag_stats', data),
  update: (id: string, data: any) => apiClient.update('question_tag_stats', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('question_tag_stats', { column: 'id', value: id })
};

export const TryoutSession = {
  list: () => apiClient.list('tryout_sessions'),
  get: (id: string) => apiClient.get('tryout_sessions', id),
  create: (data: any) => apiClient.insert('tryout_sessions', data),
  update: (id: string, data: any) => apiClient.update('tryout_sessions', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('tryout_sessions', { column: 'id', value: id })
};

export const UserAnswer = {
  list: () => apiClient.list('user_answers'),
  get: (id: string) => apiClient.get('user_answers', id),
  create: (data: any) => apiClient.insert('user_answers', data),
  update: (id: string, data: any) => apiClient.update('user_answers', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('user_answers', { column: 'id', value: id })
};

export const UserPackageAccess = {
  list: () => apiClient.list('user_package_access'),
  get: (id: string) => apiClient.get('user_package_access', id),
  create: (data: any) => apiClient.insert('user_package_access', data),
  update: (id: string, data: any) => apiClient.update('user_package_access', data, { column: 'id', value: id }),
  delete: (id: string) => apiClient.delete('user_package_access', { column: 'id', value: id })
};

export const User = {
  get: () => apiClient.getUser(),
  getSession: () => apiClient.getSession(),
  signUp: (credentials: any) => apiClient.signUp(credentials),
  signIn: (credentials: any) => apiClient.signIn(credentials),
  signOut: () => apiClient.signOut()
};



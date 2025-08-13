import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Custom API client untuk menggantikan SuperdevClient
export class ApiClient {
  private supabase: any

  constructor() {
    this.supabase = supabaseClient
  }

  // Auth methods
  async signUp(credentials: { email: string; password: string; metadata?: any }) {
    return this.supabase.auth.signUp(credentials)
  }

  async signIn(credentials: { email: string; password: string }) {
    return this.supabase.auth.signInWithPassword(credentials)
  }

  async signOut() {
    return this.supabase.auth.signOut()
  }

  async getUser() {
    return this.supabase.auth.getUser()
  }

  async getSession() {
    return this.supabase.auth.getSession()
  }

  // Database methods
  async query(table: string, options?: {
    select?: string
    where?: { column: string; value: any }
    orderBy?: { column: string; ascending: boolean }
    limit?: number
    offset?: number
  }) {
    let queryBuilder = this.supabase.from(table)
    
    if (options?.select) queryBuilder = queryBuilder.select(options.select)
    if (options?.where) queryBuilder = queryBuilder.eq(options.where.column, options.where.value)
    if (options?.orderBy) queryBuilder = queryBuilder.order(options.orderBy.column, { ascending: options.orderBy.ascending })
    if (options?.limit) queryBuilder = queryBuilder.limit(options.limit)
    if (options?.offset) queryBuilder = queryBuilder.range(options.offset, options.offset + (options.limit || 10) - 1)
    
    // Execute the query and return the result
    const result = await queryBuilder
    return result
  }

  // Simple get method for getting single record by ID
  async get(table: string, id: string) {
    const result = await this.supabase.from(table).select('*').eq('id', id).single()
    return result
  }

  async insert(table: string, data: any) {
    const result = await this.supabase.from(table).insert(data).select()
    return result
  }

  async update(table: string, data: any, where: { column: string; value: any }) {
    const result = await this.supabase.from(table).update(data).eq(where.column, where.value).select()
    return result
  }

  async delete(table: string, where: { column: string; value: any }) {
    const result = await this.supabase.from(table).delete().eq(where.column, where.value).select()
    return result
  }

  // Storage methods
  async uploadFile(bucket: string, path: string, file: File) {
    return this.supabase.storage.from(bucket).upload(path, file)
  }

  async getFileUrl(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).getPublicUrl(path)
  }

  async deleteFile(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).remove([path])
  }

  // Real-time methods
  channel(name: string) {
    return this.supabase.channel(name)
  }

  // RPC methods
  async rpc(functionName: string, params?: any) {
    return this.supabase.rpc(functionName, params)
  }

  // Simple list method for getting all records
  async list(table: string) {
    const result = await this.supabase.from(table).select('*')
    return result
  }
}

export const apiClient = new ApiClient()

// Export untuk backward compatibility
export default apiClient

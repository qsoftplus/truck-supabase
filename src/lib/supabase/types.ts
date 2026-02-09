export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trucks: {
        Row: {
          id: string
          truck_no: string
          fc_expiry: string | null
          insurance_expiry: string | null
          np_expiry: string | null
          created_at: string
        }
        Insert: {
          id?: string
          truck_no: string
          fc_expiry?: string | null
          insurance_expiry?: string | null
          np_expiry?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          truck_no?: string
          fc_expiry?: string | null
          insurance_expiry?: string | null
          np_expiry?: string | null
          created_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          license_no: string | null
          phone: string | null
          aadhar_no: string | null
          address: string | null
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          license_no?: string | null
          phone?: string | null
          aadhar_no?: string | null
          address?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          license_no?: string | null
          phone?: string | null
          aadhar_no?: string | null
          address?: string | null
          photo_url?: string | null
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          truck_id: string
          driver1_id: string
          driver2_id: string | null
          start_date: string
          end_date: string | null
          start_km: number | null
          end_km: number | null
          diesel_amount: number
          diesel_liters: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          truck_id: string
          driver1_id: string
          driver2_id?: string | null
          start_date: string
          end_date?: string | null
          start_km?: number | null
          end_km?: number | null
          diesel_amount?: number
          diesel_liters?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          truck_id?: string
          driver1_id?: string
          driver2_id?: string | null
          start_date?: string
          end_date?: string | null
          start_km?: number | null
          end_km?: number | null
          diesel_amount?: number
          diesel_liters?: number
          status?: string
          created_at?: string
        }
      }
      loads: {
        Row: {
          id: string
          trip_id: string
          loading_date: string | null
          from_location: string | null
          to_location: string | null
          transporter: string | null
          freight_amount: number
          note: string | null
          pay_term: string
          advance_amount: number
          balance_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          loading_date?: string | null
          from_location?: string | null
          to_location?: string | null
          transporter?: string | null
          freight_amount?: number
          note?: string | null
          pay_term?: string
          advance_amount?: number
          balance_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          loading_date?: string | null
          from_location?: string | null
          to_location?: string | null
          transporter?: string | null
          freight_amount?: number
          note?: string | null
          pay_term?: string
          advance_amount?: number
          balance_amount?: number
          created_at?: string
        }
      }
      courier_details: {
        Row: {
          id: string
          load_id: string
          received_date: string | null
          vendor: string | null
          delivery_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          load_id: string
          received_date?: string | null
          vendor?: string | null
          delivery_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          load_id?: string
          received_date?: string | null
          vendor?: string | null
          delivery_date?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          category: string
          title: string | null
          amount: number
          liters: number | null
          percentage: number | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          category: string
          title?: string | null
          amount?: number
          liters?: number | null
          percentage?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          category?: string
          title?: string | null
          amount?: number
          liters?: number | null
          percentage?: number | null
          created_at?: string
        }
      }
      tyres: {
        Row: {
          id: string
          truck_id: string
          make: string | null
          price: number
          fitment_date: string | null
          fitting_km: number | null
          removal_date: string | null
          removal_km: number | null
          remarks: string | null
          created_at: string
        }
        Insert: {
          id?: string
          truck_id: string
          make?: string | null
          price?: number
          fitment_date?: string | null
          fitting_km?: number | null
          removal_date?: string | null
          removal_km?: number | null
          remarks?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          truck_id?: string
          make?: string | null
          price?: number
          fitment_date?: string | null
          fitting_km?: number | null
          removal_date?: string | null
          removal_km?: number | null
          remarks?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

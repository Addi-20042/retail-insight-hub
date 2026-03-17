export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          description: string
          icon: string
          id: string
          name: string
          points: number
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category?: string
          description: string
          icon?: string
          id?: string
          name: string
          points?: number
          requirement_type?: string
          requirement_value?: number
        }
        Update: {
          category?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          created_at: string
          id: string
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          description: string | null
          due_date: string | null
          id: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          id?: string
          target_value?: number
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          id?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_login_at: string | null
          login_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_login_at?: string | null
          login_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_login_at?: string | null
          login_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          reorder_level: number
          sku: string | null
          stock_quantity: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          reorder_level?: number
          sku?: string | null
          stock_quantity?: number
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          reorder_level?: number
          sku?: string | null
          stock_quantity?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pos_transaction_items: {
        Row: {
          barcode: string
          created_at: string
          id: string
          line_total: number
          product_id: string
          product_name: string
          quantity: number
          scan_id: string | null
          scanned_at: string
          transaction_id: string
          unit_price: number
          user_id: string
        }
        Insert: {
          barcode: string
          created_at?: string
          id?: string
          line_total?: number
          product_id: string
          product_name: string
          quantity?: number
          scan_id?: string | null
          scanned_at?: string
          transaction_id: string
          unit_price?: number
          user_id: string
        }
        Update: {
          barcode?: string
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string
          product_name?: string
          quantity?: number
          scan_id?: string | null
          scanned_at?: string
          transaction_id?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: []
      }
      pos_transactions: {
        Row: {
          cashier_name: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          device_id: string | null
          id: string
          item_count: number
          started_at: string
          status: string
          total_amount: number
          transaction_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cashier_name?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          device_id?: string | null
          id?: string
          item_count?: number
          started_at?: string
          status?: string
          total_amount?: number
          transaction_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cashier_name?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          device_id?: string | null
          id?: string
          item_count?: number
          started_at?: string
          status?: string
          total_amount?: number
          transaction_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_data: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          customer_id: string | null
          date: string
          device_id: string | null
          id: string
          product: string
          product_id: string | null
          quantity: number
          revenue: number
          source: string
          transaction_id: string | null
          transaction_status: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          customer_id?: string | null
          date: string
          device_id?: string | null
          id?: string
          product: string
          product_id?: string | null
          quantity?: number
          revenue?: number
          source?: string
          transaction_id?: string | null
          transaction_status?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          customer_id?: string | null
          date?: string
          device_id?: string | null
          id?: string
          product?: string
          product_id?: string | null
          quantity?: number
          revenue?: number
          source?: string
          transaction_id?: string | null
          transaction_status?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          day_of_week: number | null
          email_recipients: string[] | null
          enabled: boolean
          id: string
          last_sent_at: string | null
          name: string
          next_run_at: string | null
          report_type: string
          schedule: string
          time_of_day: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          email_recipients?: string[] | null
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          name: string
          next_run_at?: string | null
          report_type?: string
          schedule?: string
          time_of_day?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          email_recipients?: string[] | null
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          name?: string
          next_run_at?: string | null
          report_type?: string
          schedule?: string
          time_of_day?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      upload_history: {
        Row: {
          created_at: string
          filename: string
          id: string
          rows_count: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          rows_count?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          rows_count?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_pos_transaction: {
        Args: {
          p_transaction_id: string
        }
        Returns: Json
      }
      complete_pos_transaction: {
        Args: {
          p_transaction_id: string
        }
        Returns: Json
      }
      process_pos_scan: {
        Args: {
          p_barcode: string
          p_cashier_name?: string | null
          p_customer_id?: string | null
          p_device_id?: string | null
          p_quantity?: number
          p_scan_id?: string | null
          p_transaction_id?: string | null
        }
        Returns: Json
      }
      seed_demo_products: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      start_pos_transaction: {
        Args: {
          p_cashier_name?: string | null
          p_customer_id?: string | null
          p_device_id?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

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
      alert_recipients: {
        Row: {
          created_at: string
          email: string
          id: string
          phone: string | null
          receive_email: boolean | null
          receive_sms: boolean | null
          severity_filter:
            | Database["public"]["Enums"]["severity_level"][]
            | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          receive_email?: boolean | null
          receive_sms?: boolean | null
          severity_filter?:
            | Database["public"]["Enums"]["severity_level"][]
            | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          receive_email?: boolean | null
          receive_sms?: boolean | null
          severity_filter?:
            | Database["public"]["Enums"]["severity_level"][]
            | null
          user_id?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_id: string
          created_at: string
          email_sent: boolean | null
          id: string
          message: string
          obstacle_id: string | null
          read_at: string | null
          sms_sent: boolean | null
          status: Database["public"]["Enums"]["alert_status"]
          type: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          email_sent?: boolean | null
          id?: string
          message: string
          obstacle_id?: string | null
          read_at?: string | null
          sms_sent?: boolean | null
          status?: Database["public"]["Enums"]["alert_status"]
          type?: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          email_sent?: boolean | null
          id?: string
          message?: string
          obstacle_id?: string | null
          read_at?: string | null
          sms_sent?: boolean | null
          status?: Database["public"]["Enums"]["alert_status"]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_obstacle_id_fkey"
            columns: ["obstacle_id"]
            isOneToOne: false
            referencedRelation: "obstacles"
            referencedColumns: ["id"]
          },
        ]
      }
      obstacles: {
        Row: {
          address: string
          area: string
          assigned_to: string | null
          created_at: string
          created_by: string | null
          detected_at: string
          id: string
          lat: number
          lng: number
          obstacle_id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          status: Database["public"]["Enums"]["obstacle_status"]
          type: Database["public"]["Enums"]["obstacle_type"]
          updated_at: string
        }
        Insert: {
          address?: string
          area?: string
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          detected_at?: string
          id?: string
          lat: number
          lng: number
          obstacle_id: string
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["obstacle_status"]
          type: Database["public"]["Enums"]["obstacle_type"]
          updated_at?: string
        }
        Update: {
          address?: string
          area?: string
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          detected_at?: string
          id?: string
          lat?: number
          lng?: number
          obstacle_id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["obstacle_status"]
          type?: Database["public"]["Enums"]["obstacle_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_status: "sent" | "acknowledged" | "resolved"
      app_role: "admin" | "authority"
      obstacle_status: "reported" | "in_progress" | "resolved"
      obstacle_type: "pothole" | "crack" | "water_hazard" | "debris"
      severity_level: "low" | "medium" | "high"
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
    Enums: {
      alert_status: ["sent", "acknowledged", "resolved"],
      app_role: ["admin", "authority"],
      obstacle_status: ["reported", "in_progress", "resolved"],
      obstacle_type: ["pothole", "crack", "water_hazard", "debris"],
      severity_level: ["low", "medium", "high"],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      user_default_printings: {
        Row: {
          user_id: string;
          oracle_id: string;
          printing_id: string;
          finish: string;
        };
        Insert: {
          user_id: string;
          oracle_id: string;
          printing_id: string;
          finish: string;
        };
        Update: {
          user_id?: string;
          oracle_id?: string;
          printing_id?: string;
          finish?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_default_printings_printing_id_fkey';
            columns: ['printing_id'];
            isOneToOne: false;
            referencedRelation: 'card_printings';
            referencedColumns: ['id'];
          },
        ];
      };
      card_printings: {
        Row: {
          id: string;
          oracle_id: string;
          set_code: string;
          collector_number: string;
          lang: string;
          released_at: string;
          finish_mask: number;
          image_paths: string[];
          flavor_name: string | null;
          tcgplayer_id: number | null;
          usd_cents: number | null;
          foil_cents: number | null;
          etched_cents: number | null;
        };
        Insert: {
          id: string;
          oracle_id: string;
          set_code: string;
          collector_number: string;
          lang: string;
          released_at: string;
          finish_mask: number;
          image_paths: string[];
          flavor_name: string | null;
          tcgplayer_id: number | null;
          usd_cents: number | null;
          foil_cents: number | null;
          etched_cents: number | null;
        };
        Update: {
          id?: string;
          oracle_id?: string;
          set_code?: string;
          collector_number?: string;
          lang?: string;
          released_at?: string;
          finish_mask?: number;
          image_paths?: string[];
          flavor_name?: string | null;
          tcgplayer_id?: number | null;
          usd_cents?: number | null;
          foil_cents?: number | null;
          etched_cents?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'card_printings_set_code_fkey';
            columns: ['set_code'];
            isOneToOne: false;
            referencedRelation: 'card_printing_sets';
            referencedColumns: ['code'];
          },
        ];
      };
      card_printing_sets: {
        Row: { code: string; name: string };
        Insert: { code: string; name: string };
        Update: { code?: string; name?: string };
        Relationships: [];
      };
      card_printing_sync: {
        Row: { id: boolean; source_version: string; completed_at: string };
        Insert: { id: boolean; source_version: string; completed_at: string };
        Update: {
          id?: boolean;
          source_version?: string;
          completed_at?: string;
        };
        Relationships: [];
      };

      deck_business_cards: {
        Row: {
          list_id: string;
          playstyles: string[];
          opening_hand: string[];
          combos: Json;
          playstyle: string;
          summary: string;
          win_plan: string;
          bracket: number | null;
          hero_oracle_id: string | null;
          core_oracle_ids: string[];
        };
        Insert: {
          list_id: string;
          playstyles?: string[];
          opening_hand?: string[];
          combos?: Json;
          playstyle?: string;
          summary?: string;
          win_plan?: string;
          bracket?: number | null;
          hero_oracle_id?: string | null;
          core_oracle_ids?: string[];
        };
        Update: {
          list_id?: string;
          playstyles?: string[];
          opening_hand?: string[];
          combos?: Json;
          playstyle?: string;
          summary?: string;
          win_plan?: string;
          bracket?: number | null;
          hero_oracle_id?: string | null;
          core_oracle_ids?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'deck_business_cards_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: true;
            referencedRelation: 'card_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      deck_folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: { name?: string; parent_id?: string | null };
        Relationships: [];
      };
      card_tags: {
        Row: { id: string; user_id: string; name: string };
        Insert: { id?: string; user_id: string; name: string };
        Update: { name?: string };
        Relationships: [];
      };
      card_tag_assignments: {
        Row: { user_id: string; tag_id: string; oracle_id: string };
        Insert: { user_id: string; tag_id: string; oracle_id: string };
        Update: { tag_id?: string };
        Relationships: [];
      };

      card_comments: {
        Row: {
          id: number;
          oracle_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: { oracle_id: string; body: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'card_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      article_comments: {
        Row: {
          article_id: string;
          body: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          article_id: string;
          body: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          article_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_comments_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
        ];
      };
      article_likes: {
        Row: {
          article_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          article_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          article_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_likes_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
        ];
      };
      articles: {
        Row: {
          comment_count: number;
          content: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string | null;
          is_published: boolean;
          like_count: number;
          published_at: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
          view_count: number;
        };
        Insert: {
          comment_count?: number;
          content?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          like_count?: number;
          published_at?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
          view_count?: number;
        };
        Update: {
          comment_count?: number;
          content?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          like_count?: number;
          published_at?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          view_count?: number;
        };
        Relationships: [];
      };
      card_history: {
        Row: {
          card_id: string | null;
          created_at: string;
          id: number;
          user_id: string | null;
        };
        Insert: {
          card_id?: string | null;
          created_at?: string;
          id?: number;
          user_id?: string | null;
        };
        Update: {
          card_id?: string | null;
          created_at?: string;
          id?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      card_list_items: {
        Row: {
          printing_id: string | null;
          finish: string | null;
          board: string;
          card_id: string | null;
          created_at: string;
          id: string;
          is_commander: boolean;
          list_id: string | null;
          num_copies: number;
          oracle_id: string;
        };
        Insert: {
          printing_id?: string | null;
          finish?: string | null;
          board?: string;
          card_id?: string | null;
          created_at?: string;
          id?: string;
          is_commander?: boolean;
          list_id?: string | null;
          num_copies?: number;
          oracle_id: string;
        };
        Update: {
          printing_id?: string | null;
          finish?: string | null;
          board?: string;
          card_id?: string | null;
          created_at?: string;
          id?: string;
          is_commander?: boolean;
          list_id?: string | null;
          num_copies?: number;
          oracle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'card_list_items_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'card_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      card_list_primer: {
        Row: {
          created_at: string;
          id: number;
          list_id: string;
          text: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          list_id: string;
          text?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          list_id?: string;
          text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'card_list_primer_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: true;
            referencedRelation: 'card_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      deck_revisions: {
        Row: {
          id: number;
          list_id: string;
          user_id: string;
          created_at: string;
          transaction_id: number | null;
          action: string;
          snapshot: Json;
          summary: Json;
          undo: Json;
        };
        Insert: {
          id?: never;
          list_id: string;
          user_id: string;
          created_at?: string;
          transaction_id?: number | null;
          action: string;
          snapshot?: Json;
          summary?: Json;
          undo?: Json;
        };
        Update: {
          action?: string;
          snapshot?: Json;
          summary?: Json;
          undo?: Json;
        };
        Relationships: [];
      };
      card_lists: {
        Row: {
          bracket: number | null;
          new_cards_acknowledged_at: string | null;
          target_budget: number | null;
          kind: string;
          folder_id: string | null;
          avatar_card_name: string | null;
          avatar_printing_id: string | null;
          color_ratios: Json;
          commanders: string[];
          comment_count: number;
          created_at: string;
          description: string | null;
          format: string;
          id: string;
          like_count: number;
          name: string | null;
          save_count: number;
          updated_at: string | null;
          user_id: string | null;
          view_count: number;
          visibility: Database['public']['Enums']['visibility'];
        };
        Insert: {
          bracket?: number | null;
          new_cards_acknowledged_at?: string | null;
          target_budget?: number | null;
          kind?: string;
          folder_id?: string | null;
          avatar_card_name?: string | null;
          avatar_printing_id?: string | null;
          color_ratios?: Json;
          commanders?: string[];
          comment_count?: number;
          created_at?: string;
          description?: string | null;
          format?: string;
          id?: string;
          like_count?: number;
          name?: string | null;
          save_count?: number;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number;
          visibility?: Database['public']['Enums']['visibility'];
        };
        Update: {
          bracket?: number | null;
          new_cards_acknowledged_at?: string | null;
          target_budget?: number | null;
          kind?: string;
          folder_id?: string | null;
          avatar_card_name?: string | null;
          avatar_printing_id?: string | null;
          color_ratios?: Json;
          commanders?: string[];
          comment_count?: number;
          created_at?: string;
          description?: string | null;
          format?: string;
          id?: string;
          like_count?: number;
          name?: string | null;
          save_count?: number;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number;
          visibility?: Database['public']['Enums']['visibility'];
        };
        Relationships: [];
      };
      decklist_comments: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          list_id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          list_id?: string;
          user_id?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          list_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'decklist_comments_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'card_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      decklist_likes: {
        Row: {
          created_at: string;
          list_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          list_id?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          list_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'decklist_likes_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'card_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      decklist_saves: {
        Row: {
          created_at: string;
          list_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          list_id?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          list_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'decklist_saves_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'card_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      patreon_links: {
        Row: {
          created_at: string;
          last_charge_status: string | null;
          patreon_user_id: string;
          patron_status: string | null;
          pledge_cents: number | null;
          tier_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          last_charge_status?: string | null;
          patreon_user_id: string;
          patron_status?: string | null;
          pledge_cents?: number | null;
          tier_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          last_charge_status?: string | null;
          patreon_user_id?: string;
          patron_status?: string | null;
          pledge_cents?: number | null;
          tier_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      preferences: {
        Row: {
          deck_group_by: string | null;
          deck_sort_by: string | null;
          deck_sort_direction: string;
          deck_view: string;
          user_id: string;
        };
        Insert: {
          deck_group_by?: string | null;
          deck_sort_by?: string | null;
          deck_sort_direction?: string;
          deck_view?: string;
          user_id: string;
        };
        Update: {
          deck_group_by?: string | null;
          deck_sort_by?: string | null;
          deck_sort_direction?: string;
          deck_view?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_card_name: string;
          avatar_printing_id: string | null;
          created_at: string;
          follower_count: number;
          id: string;
          is_author: boolean;
          is_featured: boolean;
          patreon_featured: boolean;
          username: string | null;
        };
        Insert: {
          avatar_card_name?: string;
          avatar_printing_id?: string | null;
          created_at?: string;
          follower_count?: number;
          id: string;
          is_author?: boolean;
          is_featured?: boolean;
          patreon_featured?: boolean;
          username?: string | null;
        };
        Update: {
          avatar_card_name?: string;
          avatar_printing_id?: string | null;
          created_at?: string;
          follower_count?: number;
          id?: string;
          is_author?: boolean;
          is_featured?: boolean;
          patreon_featured?: boolean;
          username?: string | null;
        };
        Relationships: [];
      };
      search_history: {
        Row: {
          created_at: string;
          filters: Json | null;
          id: string;
          query: string | null;
          search_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          filters?: Json | null;
          id?: string;
          query?: string | null;
          search_type?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          filters?: Json | null;
          id?: string;
          query?: string | null;
          search_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_follows: {
        Row: {
          created_at: string;
          followee_id: string;
          follower_id: string;
        };
        Insert: {
          created_at?: string;
          followee_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          follower_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_deck_printings: {
        Args: { p_list: string; p_items: Json };
        Returns: undefined;
      };
      sync_card_printings: {
        Args: { p_sets: Json; p_rows: Json };
        Returns: undefined;
      };
      update_card_list_contents: {
        Args: { p_list: string; p_boards: string[]; p_items: Json };
        Returns: Json;
      };
      restore_deck_revision: {
        Args: { p_list: string; p_revision: number; p_expected_head: number };
        Returns: number;
      };

      delete_deck_folder: {
        Args: { p_folder: string; p_confirmation?: string };
        Returns: number;
      };

      increment_article_view_count: {
        Args: { p_article_id: string };
        Returns: undefined;
      };
      increment_decklist_view_count: {
        Args: { p_list_id: string };
        Returns: undefined;
      };
      patreon_apply_webhook: {
        Args: {
          p_featured: boolean;
          p_last_charge_status?: string;
          p_patreon_user_id: string;
          p_patron_status?: string;
          p_pledge_cents?: number;
          p_tier_id?: string;
        };
        Returns: string;
      };
      patreon_disconnect: { Args: { p_user_id: string }; Returns: undefined };
      patreon_link_account: {
        Args: {
          p_featured: boolean;
          p_last_charge_status?: string;
          p_patreon_user_id: string;
          p_patron_status?: string;
          p_pledge_cents?: number;
          p_tier_id?: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
    };
    Enums: {
      visibility: 'private' | 'public';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      visibility: ['private', 'public'],
    },
  },
} as const;

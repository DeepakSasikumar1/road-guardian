-- Create enum types for obstacle management
CREATE TYPE public.obstacle_type AS ENUM ('pothole', 'crack', 'water_drain', 'debris');
CREATE TYPE public.severity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.obstacle_status AS ENUM ('reported', 'in_progress', 'resolved');
CREATE TYPE public.alert_status AS ENUM ('sent', 'acknowledged', 'resolved');
CREATE TYPE public.app_role AS ENUM ('admin', 'authority');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'authority',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create obstacles table
CREATE TABLE public.obstacles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obstacle_id TEXT UNIQUE NOT NULL,
  type public.obstacle_type NOT NULL,
  severity public.severity_level NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.obstacle_status NOT NULL DEFAULT 'reported',
  assigned_to TEXT,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT UNIQUE NOT NULL,
  obstacle_id UUID REFERENCES public.obstacles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'high_severity',
  message TEXT NOT NULL,
  status public.alert_status NOT NULL DEFAULT 'sent',
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Create alert_recipients table for configuring who receives alerts
CREATE TABLE public.alert_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  receive_email BOOLEAN DEFAULT true,
  receive_sms BOOLEAN DEFAULT true,
  severity_filter public.severity_level[] DEFAULT ARRAY['high']::public.severity_level[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obstacles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_recipients ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles (only admins can manage)
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for obstacles (all authenticated users can view/manage)
CREATE POLICY "Authenticated users can view obstacles" ON public.obstacles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert obstacles" ON public.obstacles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update obstacles" ON public.obstacles FOR UPDATE TO authenticated USING (true);

-- RLS Policies for alerts
CREATE POLICY "Authenticated users can view alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alerts" ON public.alerts FOR UPDATE TO authenticated USING (true);

-- RLS Policies for alert_recipients
CREATE POLICY "Users can view own alert settings" ON public.alert_recipients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own alert settings" ON public.alert_recipients FOR ALL TO authenticated USING (user_id = auth.uid());

-- Create trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'authority');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_obstacles_updated_at
  BEFORE UPDATE ON public.obstacles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_obstacles_severity ON public.obstacles(severity);
CREATE INDEX idx_obstacles_status ON public.obstacles(status);
CREATE INDEX idx_obstacles_area ON public.obstacles(area);
CREATE INDEX idx_obstacles_detected_at ON public.obstacles(detected_at DESC);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);

-- Enable realtime for obstacles and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.obstacles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
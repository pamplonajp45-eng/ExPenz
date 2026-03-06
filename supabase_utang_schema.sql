-- Table: utangs
CREATE TABLE utangs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('lent', 'borrowed')) NOT NULL,
    person_name TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    balance NUMERIC NOT NULL CHECK (balance >= 0),
    date DATE NOT NULL,
    reason TEXT,
    due_date DATE,
    has_interest BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('active', 'settled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: utang_payments
CREATE TABLE utang_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utang_id UUID REFERENCES utangs(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) setup for utangs
ALTER TABLE utangs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only select their own utangs." 
ON utangs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own utangs." 
ON utangs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own utangs." 
ON utangs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own utangs." 
ON utangs FOR DELETE USING (auth.uid() = user_id);

-- Row Level Security (RLS) setup for utang_payments
ALTER TABLE utang_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see payments for their utangs." 
ON utang_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM utangs WHERE utangs.id = utang_payments.utang_id AND utangs.user_id = auth.uid())
);

CREATE POLICY "Users can insert payments for their utangs." 
ON utang_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM utangs WHERE utangs.id = utang_payments.utang_id AND utangs.user_id = auth.uid())
);

CREATE POLICY "Users can delete payments for their utangs." 
ON utang_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM utangs WHERE utangs.id = utang_payments.utang_id AND utangs.user_id = auth.uid())
);

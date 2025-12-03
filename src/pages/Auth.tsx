import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in"
        });
      } else {
        await signUp(email, password, fullName);
        toast({
          title: "Account created!",
          description: "Welcome to After Brakes"
        });
      }
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Dashboard seam lines */}
      <div className="seam-line absolute top-0 left-0 right-0" />
      <div className="seam-line absolute bottom-0 left-0 right-0" />

      <div className="w-full max-w-md">
        {/* Logo and title card */}
        <div className="card-vignette p-8 mb-8 text-center">
          <Car className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-heading text-foreground mb-2 font-serif">After Brakes</h1>
          <p className="text-body text-muted-foreground">AI Automotive Expert</p>
        </div>

        {/* Auth form */}
        <div className="panel-floating p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-subheading text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Get Started"}
            </h2>
            <p className="text-small text-muted-foreground">
              {isLogin ? "Sign in to continue" : "Create your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <div className="space-y-2">
                <Label htmlFor="fullName" className="text-small font-medium">
                  Full Name
                </Label>
                <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required={!isLogin} className="bg-card border-border/40 rounded-2xl h-12 focus-visible:ring-primary" placeholder="Enter your name" />
              </div>}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-small font-medium">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-card border-border/40 rounded-2xl h-12 focus-visible:ring-primary" placeholder="your@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-small font-medium">
                Password
              </Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-card border-border/40 rounded-2xl h-12 focus-visible:ring-primary" placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 btn-glow text-body font-medium mt-6">
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-small text-muted-foreground hover:text-primary transition-colors">
              {isLogin ? "Need an account? " : "Already have an account? "}
              <span className="font-medium text-primary">
                {isLogin ? "Sign Up" : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;
// --- CHANGES MADE ---
// 1. Phone number validation requires +91XXXXXXXXXX (13 chars).
// 2. Always send only 10 digits to backend (no +91).
// 3. Separate loading states for send OTP and verify OTP.
// 4. OTP flow integrated without breaking signup flow.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Stethoscope,
  Loader2
} from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!formData.phone.startsWith("+91") || formData.phone.length !== 13) {
      toast({
        title: "OTP Error",
        description: "Enter a valid Indian mobile number (+91XXXXXXXXXX)",
        variant: "destructive"
      });
      return;
    }
    setOtpLoading(true);
    try {
      const mobileOnly = formData.phone.slice(3); // send only 10 digits
      const response = await fetch("http://localhost:5002/api/otp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileOnly })
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: "OTP has been sent to your mobile number."
        });
      } else {
        toast({
          title: "OTP Error",
          description: data.error || "Failed to send OTP",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "OTP Error",
        description: "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      toast({
        title: "OTP Error",
        description: "Enter the OTP received on your mobile",
        variant: "destructive"
      });
      return;
    }
    setOtpLoading(true);
    try {
      const mobileOnly = formData.phone.slice(3);
      const response = await fetch("http://localhost:5002/api/otp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileOnly, otp })
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        setOtpVerified(true);
        toast({
          title: "Mobile Verified",
          description: "Your mobile number has been verified."
        });
      } else {
        toast({
          title: "OTP Error",
          description: data.error || "Invalid OTP",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "OTP Error",
        description: "Failed to verify OTP",
        variant: "destructive"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Signup
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    if (!otpVerified) {
      toast({
        title: "Mobile Verification",
        description: "Please verify your mobile number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5002/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        toast({
          title: "Signup Successful",
          description: "Welcome to MediMate!"
        });
        navigate("/");
      } else {
        toast({
          title: "Signup Failed",
          description: data.message || "Validation failed",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">MediMate</h1>
              <p className="text-sm text-muted-foreground">Health Companion</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Create Account
          </h2>
          <p className="text-muted-foreground">
            Join MediMate for better health management
          </p>
        </div>

        {/* Signup Form */}
        <Card className="border-0 shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone with OTP */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Indian only)</Label>
                <div className="relative flex">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    maxLength={13}
                    disabled={otpSent}
                  />
                  <Button
                    type="button"
                    className="ml-2"
                    onClick={handleSendOtp}
                    disabled={otpSent || otpLoading}
                  >
                    {otpLoading
                      ? "Sending..."
                      : otpSent
                      ? "OTP Sent"
                      : "Send OTP"}
                  </Button>
                </div>
              </div>

              {otpSent && !otpVerified && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="flex">
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      className="ml-2"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </div>
              )}

              {otpVerified && (
                <div className="text-green-600 text-sm mb-2">
                  Mobile number verified!
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;

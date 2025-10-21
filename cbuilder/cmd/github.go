package cmd

import (
	"bytes"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/cobra"
)

// GitHubTokenResponse represents the response from GitHub's API
type GitHubTokenResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

var (
	pemFile    string
	appID      string
	installID  string
	expiration int
	outputFile string
)

// githubCmd represents the github command
var githubCmd = &cobra.Command{
	Use:   "github",
	Short: "Generate GitHub App installation access token",
	RunE: func(cmd *cobra.Command, args []string) error {
		// Validate required flags
		if pemFile == "" {
			return fmt.Errorf("--pem flag is required")
		}
		if appID == "" {
			return fmt.Errorf("--app flag is required")
		}
		if installID == "" {
			return fmt.Errorf("--install flag is required")
		}

		// Generate the access token
		token, err := generateGitHubToken()
		if err != nil {
			return fmt.Errorf("failed to generate GitHub token: %v", err)
		}

		// Output the token
		if outputFile != "" {
			err := writeTokenToFile(token, outputFile)
			if err != nil {
				return fmt.Errorf("failed to write token to file: %v", err)
			}
			fmt.Printf("Token written to %s\n", outputFile)
		} else {
			fmt.Println(token)
		}

		return nil
	},
}

func generateGitHubToken() (string, error) {
	// Read the private key
	privateKey, err := readPrivateKey(pemFile)
	if err != nil {
		return "", fmt.Errorf("failed to read private key: %v", err)
	}

	// Convert app ID and installation ID to integers
	appIDInt, err := strconv.Atoi(appID)
	if err != nil {
		return "", fmt.Errorf("invalid app ID: %v", err)
	}

	installIDInt, err := strconv.Atoi(installID)
	if err != nil {
		return "", fmt.Errorf("invalid installation ID: %v", err)
	}

	// Generate JWT token
	jwtToken, err := generateJWT(privateKey, appIDInt, expiration)
	if err != nil {
		return "", fmt.Errorf("failed to generate JWT: %v", err)
	}

	// Get installation access token
	accessToken, err := getInstallationToken(jwtToken, installIDInt)
	if err != nil {
		return "", fmt.Errorf("failed to get installation token: %v", err)
	}

	return accessToken, nil
}

func readPrivateKey(filepath string) (*rsa.PrivateKey, error) {
	keyData, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	block, _ := pem.Decode(keyData)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		// Try PKCS8 format
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %v", err)
		}
		rsaKey, ok := key.(*rsa.PrivateKey)
		if !ok {
			return nil, fmt.Errorf("key is not RSA private key")
		}
		return rsaKey, nil
	}

	return privateKey, nil
}

func generateJWT(privateKey *rsa.PrivateKey, appID int, expSeconds int) (string, error) {
	now := time.Now()

	claims := jwt.MapClaims{
		"iat": now.Unix(),
		"exp": now.Add(time.Duration(expSeconds) * time.Second).Unix(),
		"iss": appID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func getInstallationToken(jwtToken string, installationID int) (string, error) {
	url := fmt.Sprintf("https://api.github.com/app/installations/%d/access_tokens", installationID)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte("{}")))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", jwtToken))
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("GitHub API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp GitHubTokenResponse
	err = json.Unmarshal(body, &tokenResp)
	if err != nil {
		return "", fmt.Errorf("failed to parse response: %v", err)
	}

	return tokenResp.Token, nil
}

func writeTokenToFile(token, filepath string) error {
	return os.WriteFile(filepath, []byte(token), 0600)
}

func init() {
	githubCmd.Flags().StringVar(&pemFile, "pem", "", "Path to the GitHub App private key PEM file (required)")
	githubCmd.Flags().StringVar(&appID, "app", "", "GitHub App ID (required)")
	githubCmd.Flags().StringVar(&installID, "install", "", "GitHub App Installation ID (required)")
	githubCmd.Flags().IntVar(&expiration, "exp", 600, "JWT expiration time in seconds (default: 600)")
	githubCmd.Flags().StringVarP(&outputFile, "o", "o", "", "Output file path (optional, defaults to console)")

	githubCmd.MarkFlagRequired("pem")
	githubCmd.MarkFlagRequired("app")
	githubCmd.MarkFlagRequired("install")

	rootCmd.AddCommand(githubCmd)
}

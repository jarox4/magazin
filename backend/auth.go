package main

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func jwtSecret() []byte {
	return []byte("Stariy-bog")
}

type RegisterInput struct {
	Email    string `json:"email"     binding:"required,email"`
	Password string `json:"password"  binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
}

type LoginInput struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  UserMe `json:"user"`
}

type UserMe struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	Role     string `json:"role"`
}


// register godoc
// @Summary     Register new user
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       body body RegisterInput true "Registration data"
// @Success     201 {object} AuthResponse
// @Failure     400 {object} ErrorResponse
// @Router      /auth/register [post]
func register(c *gin.Context) {
	var in RegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()}); return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "ошибка хэша"}); return
	}
	var user UserMe
	err = db.QueryRow(context.Background(),
		`INSERT INTO users (email, password_hash, full_name, phone, address)
		 VALUES ($1,$2,$3,$4,$5)
		 RETURNING id, email, full_name, COALESCE(phone,''), COALESCE(address,''), role`,
		in.Email, string(hash), in.FullName, in.Phone, in.Address,
	).Scan(&user.ID, &user.Email, &user.FullName, &user.Phone, &user.Address, &user.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Данный email уже зарегистрирован"}); return
	}
	tok, _ := makeToken(user.ID, user.Role)
	c.JSON(http.StatusCreated, AuthResponse{Token: tok, User: user})
}


// login godoc
// @Summary     Login
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       body body LoginInput true "Credentials"
// @Success     200 {object} AuthResponse
// @Failure     401 {object} ErrorResponse
// @Router      /auth/login [post]
func login(c *gin.Context) {
	var in LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()}); return
	}
	var user UserMe
	var hash string
	err := db.QueryRow(context.Background(),
		`SELECT id, email, full_name, COALESCE(phone,''), COALESCE(address,''), role, password_hash
		 FROM users WHERE email=$1`, in.Email,
	).Scan(&user.ID, &user.Email, &user.FullName, &user.Phone, &user.Address, &user.Role, &hash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Неправильный логин или пароль"}); return
	}
	if err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Неправильный логин или пароль"}); return
	}
	tok, _ := makeToken(user.ID, user.Role)
	c.JSON(http.StatusOK, AuthResponse{Token: tok, User: user})
}

func makeToken(userID int, role string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(72 * time.Hour).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtSecret())
}

func authMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		// if !strings.HasPrefix(header, "Bearer") {
		// 	c.AbortWithStatusJSON(http.StatusUnauthorized, ErrorResponse{Error: "missing token"}); return
		// }
		tok, err := jwt.Parse(strings.TrimPrefix(header, "Bearer "), func(t *jwt.Token) (any, error) {
			return jwtSecret(), nil
		})
		if err != nil || !tok.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, ErrorResponse{Error: "недопустимый токен"}); return
		}
		claims := tok.Claims.(jwt.MapClaims)
		role := claims["role"].(string)
		userID := int(claims["sub"].(float64))

		allowed := false
		for _, r := range roles { if r == role { allowed = true; break } }
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, ErrorResponse{Error: "запрещено"}); return
		}
		c.Set("userID", userID)
		c.Set("role", role)
		c.Next()
	}
}

// getMe godoc
// @Summary     Get current user profile
// @Tags        auth
// @Security    BearerAuth
// @Produce     json
// @Success     200 {object} UserMe
// @Router      /me [get]
func getMe(c *gin.Context) {
	uid := c.GetInt("userID")
	var u UserMe
	err := db.QueryRow(context.Background(),
		`SELECT id, email, full_name, COALESCE(phone,''), COALESCE(address,''), role FROM users WHERE id=$1`, uid,
	).Scan(&u.ID, &u.Email, &u.FullName, &u.Phone, &u.Address, &u.Role)
	if err != nil { c.JSON(http.StatusNotFound, ErrorResponse{Error: "не найден"}); return }
	c.JSON(http.StatusOK, u)
}

type UpdateMeInput struct {
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
}


// updateMe godoc
// @Summary     Update current user profile
// @Tags        auth
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body body UpdateMeInput true "Profile data"
// @Success     200 {object} UserMe
// @Router      /me [put]
func updateMe(c *gin.Context) {
	uid := c.GetInt("userID")
	var in UpdateMeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()}); return
	}
	var u UserMe
	err := db.QueryRow(context.Background(),
		`UPDATE users SET full_name=$1, phone=$2, address=$3, updated_at=NOW()
		 WHERE id=$4 RETURNING id, email, full_name, COALESCE(phone,''), COALESCE(address,''), role`,
		in.FullName, in.Phone, in.Address, uid,
	).Scan(&u.ID, &u.Email, &u.FullName, &u.Phone, &u.Address, &u.Role)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	c.JSON(http.StatusOK, u)
}

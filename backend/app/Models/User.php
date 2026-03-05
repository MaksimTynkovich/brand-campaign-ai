<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
        'credits',
        'plan',
        'is_blocked',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_blocked' => 'boolean',
        ];
    }

    public function isBlocked(): bool
    {
        return (bool) ($this->is_blocked ?? false);
    }

    public function hasCredits(int $amount = 1): bool
    {
        return ($this->credits ?? 0) >= $amount;
    }

    public function spendCredits(int $amount = 1): bool
    {
        if (!$this->hasCredits($amount)) {
            return false;
        }
        $this->decrement('credits', $amount);

        return true;
    }

    public function isPaidPlan(): bool
    {
        $plan = strtolower((string) ($this->plan ?? 'trial'));
        $paidPlans = ['start', 'professional', 'business'];

        return in_array($plan, $paidPlans, true);
    }

    public function shouldUseVideoWatermark(): bool
    {
        return !$this->isPaidPlan();
    }

    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class);
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }
}

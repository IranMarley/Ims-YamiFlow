namespace Ims.YamiFlow.Application.IAM.Constants;

public static class Resources
{
    public const string Auth = "Auth";
    public const string Course = "Course";
    public const string Module = "Module";
    public const string Lesson = "Lesson";
    public const string Enrollment = "Enrollment";
    public const string Certificate = "Certificate";
    public const string Quiz = "Quiz";
    public const string Review = "Review";
    public const string Forum = "Forum";
    public const string Coupon = "Coupon";
    public const string Payment = "Payment";
    public const string Subscription = "Subscription";
    public const string Affiliate = "Affiliate";
    public const string Instructor = "Instructor";
    public const string Notification = "Notification";
    public const string Role = "Role";
    public const string User = "User";

    public static readonly IReadOnlyList<string> All = [
        Course, Module, Lesson, Enrollment, Certificate, Quiz,
        Review, Forum, Coupon, Payment, Subscription, Affiliate,
        Instructor, Notification, Role, User
    ];

    /// <summary>
    /// Maps each resource to the operations that actually have endpoints.
    /// Used by the permissions matrix to avoid showing unsupported checkboxes.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> SupportedOperations =
        new Dictionary<string, IReadOnlyList<string>>
        {
            [Course] = [Operations.Create, Operations.Read, Operations.Update],
            [Module] = [Operations.Create, Operations.Read, Operations.Update, Operations.Delete],
            [Lesson] = [Operations.Create, Operations.Read, Operations.Update, Operations.Delete],
            [Enrollment] = [Operations.Create, Operations.Read, Operations.Delete],
            [Certificate] = [Operations.Create, Operations.Read],
            [Quiz] = [Operations.Create, Operations.Read, Operations.Update, Operations.Delete],
            [Review] = [Operations.Create, Operations.Read, Operations.Update, Operations.Delete],
            [Forum] = [Operations.Create, Operations.Read, Operations.Delete],
            [Coupon] = [Operations.Create, Operations.Read, Operations.Delete],
            [Payment] = [Operations.Create, Operations.Read],
            [Subscription] = [Operations.Create, Operations.Read, Operations.Update],
            [Affiliate] = [Operations.Create, Operations.Read],
            [Instructor] = [Operations.Read],
            [Notification] = [Operations.Read, Operations.Update],
            [Role] = [Operations.Create, Operations.Read, Operations.Update, Operations.Delete],
            [User] = [Operations.Read, Operations.Update],
        };
}

public static class Operations
{
    public const string Create = "Create";
    public const string Read = "Read";
    public const string Update = "Update";
    public const string Delete = "Delete";

    public static readonly IReadOnlyList<string> All =
        [Create, Read, Update, Delete];
}

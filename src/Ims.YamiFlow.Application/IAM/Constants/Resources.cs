namespace Ims.YamiFlow.Application.IAM.Constants;

public static class Resources
{
    public const string Auth = "Auth";
    public const string Course = "Course";
    public const string Module = "Module";
    public const string Lesson = "Lesson";
    public const string Enrollment = "Enrollment";
    public const string Certificate = "Certificate";
    public const string Payment = "Payment";
    public const string Subscription = "Subscription";
    public const string Instructor = "Instructor";
    public const string Role = "Role";
    public const string User = "User";

    public static readonly IReadOnlyList<string> All = [
        Course, Module, Lesson, Enrollment, Certificate,
        Payment, Subscription, Instructor, Role, User
    ];

    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> SupportedOperations =
        new Dictionary<string, IReadOnlyList<string>>
        {
            [Course] = [Operations.Create, Operations.Read, Operations.Update],
            [Module] = [Operations.Create, Operations.Read, Operations.Update, Operations.Delete],
            [Lesson] = [Operations.Create, Operations.Read, Operations.Update, Operations.Delete],
            [Enrollment] = [Operations.Create, Operations.Read, Operations.Delete],
            [Certificate] = [Operations.Create, Operations.Read],
            [Payment] = [Operations.Create, Operations.Read],
            [Subscription] = [Operations.Create, Operations.Read, Operations.Update],
            [Instructor] = [Operations.Read],
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
